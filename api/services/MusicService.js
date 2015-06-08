/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
// the player instance
var player;
var fs;

var playing = false;

if(sails.config.machine.soundCapable){
	var Player = require('player');
	fs = require('fs');
	var id3 = require('id3js');
	var dir = require('node-dir');
}


/**
 * Description
 * @method insertMusic
 * @param {} file
 * @param {} name
 * @param {} artist
 * @param {} album
 * @param {} callback
 * @return 
 */
function insertMusic(file, name, artist, album, callback){
	var MusicObj = {
		file:file,
		name:name, 
		artist:artist,
		album:album
	};

	// test if music already exist
	Music.findOne({file : file}, function(err,music){
		if(err) return callback(err);

		// if yes
		if(music){
			// update the music id3tags
			Music.update({id:music.id},MusicObj,function(err,music){
				if(err) return callback(err);

				callback(null, music);
			});
		// if not
		}else{
			// create the music in the database
			Music.create(MusicObj, function(err, music){
				if(err) return callback(err);

				callback(null, music);
			});
		}
	});

	
}

/**
 * Description
 * @method getId3Tags
 * @param {} file
 * @param {} callback
 * @return 
 */
function getId3Tags(file,callback){
	id3({ file: file, type: id3.OPEN_LOCAL }, callback);
}

module.exports = {
	
	/**
	 * Description
	 * @method playWithId
	 * @param {} id
	 * @return 
	 */
	playWithId: function(id){
			Music.findOne({id:id})
				.exec(function(err, music){
					if(err) return sails.log.warn(err);
					
					if(music){
						MusicService.play(music.file);
					}else{
						sails.log.warn('No music found with id = '+ id);
					}
				});
	},

	/**
	 * Description
	 * @method play
	 * @param {} file
	 * @return 
	 */
	play : function(file){

		// if the machine is soundCapable (for example a server can't play sound)
		if(!sails.config.machine.soundCapable){
			sails.log.warn('Machine can\'t play sound');
			return;
		}

		var musicPath = sails.config.music.folder + file;

		// test if the music file exist
		if (!fs.existsSync(musicPath)) {
		    return sails.log.warn('MusicService : play : '+ musicPath +' does not exist');
		}
		playing = true;
		
		// play the music file
		player = new Player(musicPath);
		player.on('playing',function(item){
			//playing!
		});
		sails.log.info('Playing : ' + musicPath);
		player.play(function(err, player){
		  	// end of music	
		  	playing = false;
		});
	},

	/**
	 * Description
	 * @method stop
	 * @return 
	 */
	stop:function(){
		player.stop();
	},

	/**
	 * Description
	 * @method playlist
	 * @param {} idPlaylist
	 * @return 
	 */
	playlist : function(idPlaylist){
		if(!sails.config.machine.soundCapable){
			sails.log.warn('Machine can\'t play sound');
			return;
		}
	},

	/**
	 * Description
	 * @method importFolder
	 * @param {} callback
	 * @return 
	 */
	importFolder: function(callback){
		var inserted = 0;
		var size;

		// check if the importation is finished
		/**
		 * Description
		 * @method checkIfDone
		 * @return 
		 */
		var checkIfDone = function(){
			inserted++;
			if(inserted >= size)
				callback(null);
		}

		if(sails.config.machine.soundCapable){
			// get recursively all the files in the folder
			dir.files(sails.config.music.folder, function(err, files) {
				if(err) return sails.log.warn(err);
		
				if(files){
		
					size = files.length;
		
				   	for(var i=0;i<files.length;i++){
		
				   		(function(file) { 
				   		// get the extension of the file
				   		var ext = file.substr(file.lastIndexOf('.') + 1);
		
				   			// check if the file's extension is valid
					   		if(ext == sails.config.music.validExtension){
		
					   			// remove the music folder from the path
					   			file = file.substring(sails.config.music.folder.length);
		
					   			// Get the id3Tags
						   		getId3Tags(sails.config.music.folder + file, function(err, tags){
						   			if(err) {
						   				sails.log.warn(err);
						   				checkIfDone();
						   			}
						   			else{
							   			if(tags.title == null)
							   				tags.title = file;
		
							   			// insert the music in the database
							   			insertMusic(file, tags.title, tags.artist,tags.album, function(err,music){
							   				if(err) sails.log.warn(err);
		
							   				checkIfDone();
							   			});
							   		}
						   		});
						   	}else
						   	{
						   		checkIfDone();
						   	}
		
					   	})(files[i]);
				   	}
				}
			});
		}
	},
};
