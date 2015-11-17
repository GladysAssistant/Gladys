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
	  var file = fs.createWriteStream(dest);
	  var request = http.get(url, function(response) {
	    response.pipe(file);
	    file.on('finish', function() {
	      file.close(callback);
	    });
	  });
	};

	/**
	 * Play a MP3
	 * @method play
	 * @param {} mp3
	 * @return
	 */
	var play = function (mp3){
		fs.createReadStream(mp3)
		  .pipe(new lame.Decoder())
		  .on('format', function (format) {
		    this.pipe(new Speaker(format));
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
}

module.exports = {

	/**
	 * Say the given text
	 * @method say
	 * @param {} text
	 * @param {} User
	 * @return
	 */
	say: function(text,User){
		if(!sails.config.machine.soundCapable){
			sails.log.warn('Machine can\'t play sound');
			return;
		}

		/*if(!User || !User.language)
			return sails.log.warn('No User with language given');*/

		Speak.findOne({ text: text})
			 .exec(function speakFound(err, Speak){
			 		if(err) return sails.log.info(err);

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
			 			download(url,pathToMp3, function(){
			 				// playing mp3
			 				play(pathToMp3);
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
			 			play(pathToMp3);
			 			if(User){
			 				// add the sentence to Speak database
			 				addSpeak(text,Speak.mp3file,User);
			 			}
			 		}
			 });



	}






};
