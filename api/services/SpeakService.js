/**
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */


if(sails.config.machine.soundCapable){
	var fs = require('fs');
	var lame = require('lame');
	var Speaker = require('speaker');
	var http = require('http');
	var md5 = require('md5');
	var async = require('async');

	/**
	 * Downloading a file of an given 'url',
	 * and putting the file in the 'dest' file,
	 * then 'callback'
	 * @method download
	 * @param {} url
	 * @param {} dest
	 * @param {} callback
	 * @return
	 */
	var download = function (url, dest, callback) {
		var request = http.get(url, function(response) {
			if(response.statusCode >= 200 && response.statusCode < 300){
				var file = fs.createWriteStream(dest);
				response.pipe(file);
				file.on('finish', function() {
					file.close(callback);
				});
			}else{
				callback('Invalid statusCode : '+ response.statusCode);
			}
	  });
	};

	/**
	 * Play a MP3
	 * @method play
	 * @param {} mp3
	 * @param {} callback
	 * @return
	 */
	var play = function (mp3, callback){
		fs.createReadStream(mp3)
		  .pipe(new lame.Decoder())
		  .on('format', function (format) {
				var speaker = new Speaker(format);
				speaker.on('close', callback);
				this.pipe(speaker);
			});
	};

	/**
	 * Save in the database a sentence
	 * we have just been saying
	 * @method addSpeak
	 * @param {} text
	 * @param {} mp3file
	 * @param {} User
	 * @param {} callback
	 * @return
	 */
	var addSpeak = function(text,mp3file,User,callback){
		var speakObj = {
			text:text,
			mp3file:mp3file,
			user:User.id
		};
		// creating the new Speak
		Speak.create(speakObj, function speakCreated(err,Speak){
			if(err) return sails.log.warn(Speak);
			if(callback)
				callback();
		});
	};

	/**
	 * @method say
	 * @param {} infoObj
	 * @param {} callback
	 */
	var say = function(infoObj, callback){
		var User = infoObj.User;
		var text = infoObj.text;

		/*if(!User || !User.language)
			return sails.log.warn('No User with language given');*/

		Speak.findOne({ text: text})
			.exec(function speakFound(err, Speak){
				if(err){
					sails.log.info(err);
					return callback(err);
				}

				var pathToMp3;

				if(!Speak)
				{ // if it is the first time we are saying this sentence

					// getting the google Voice lang parametre
					var langParam = sails.config.googlevoice.langParametre;
					// getting the user preference of language
					var lang;
					// getting the google voice charset parametre
					var charsetParam = sails.config.googlevoice.charsetParametre;
					var charsetVal = sails.config.googlevoice.charsetValue;
					if(User && User.language){
						lang = User.language;
					}else{
						// if User's language is not set
						lang = sails.config.googlevoice.defaultsLang;
					}
					// composing an google URL to retrieve a mp3 file saying the text
					var url = sails.config.googlevoice.url + '?' + sails.config.googlevoice.queryParametre + '='+ text;
					url += '&' + langParam + '=' + lang + '&' + charsetParam + '=' + charsetVal + '&client=tw-ob';
					var mp3file = md5(text) + '.mp3';

					pathToMp3 = sails.config.googlevoice.cacheDirectory + '/' + mp3file;
					// downloading mp3 from Google
					download(url,pathToMp3, function(err){
						if(err)return callback(err);

						// playing mp3
						play(pathToMp3, callback);
						if(User){
							addSpeak(text,mp3file,User);
						}
					});

				}
				else
				{
				//if text has already been said before
					// get the path to the mp3 of the sentence
					pathToMp3 = sails.config.googlevoice.cacheDirectory + '/' + Speak.mp3file;
					// play the mp3 file
					play(pathToMp3, callback);
					if(User){
						// add the sentence to Speak database
						addSpeak(text,Speak.mp3file,User);
					}
				}
			});
	};

	// queue object to say sentence per sentence
	var queue = async.queue(say, 1);
}

module.exports = {

	/**
	 * Say the given text
	 * @method say
	 * @param {} text
	 * @param {} User
	 * @param {} callback
	 * @return
	 */
	say: function(text,User,callback){
		callback = callback || function(){};

		if(!sails.config.machine.soundCapable){
			callback('Machine can\'t play sound');
			sails.log.warn('Machine can\'t play sound');
			return;
		}

		var sentences = text.split('.');
		async.each(sentences, function(sentence){
			if(sentence.length > 0)
				queue.push({User:User, text: sentence});
		});

		callback();
	}

};
