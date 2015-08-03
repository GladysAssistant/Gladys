/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

var vm = require('vm');
var fs = require("fs");

/**
 * Description
 * @method validFileName
 * @param {} name
 * @return CallExpression
 */
function validFileName (name){
	var reg = /[a-zA-Z0-9]+\.js$/;
	return reg.test(name);
}

/**
 * Description
 * @method loadInSandbox
 * @param {} path
 * @param {} callback
 * @return 
 */
function loadInSandbox (path, callback){
	callback = callback || function(){};
	
	fs.readdir(path, function (err, files) {
	   if(err) return callback(err);

	   for(var key in files){
	   		var file = files[key];
	   		if(validFileName(file)){
	   			file = file.substring(0,file.length-3);
	   			sandbox[file] = global[file];
	   			delete sandbox[file]['sails'];
	   		}
	   }
	   callback(null);
	});
}

var sandbox = sails.config.scripts.defaultSandbox;

sails.config.Event.on('sailsReady', function(){
	// adding sails.log function to sandbox
	sandbox.sails = {};
	sandbox.sails.log = sails.log;
	// adding all the Gladys "api/services" to sandbox
	loadInSandbox(sails.config.scripts.servicesFolder, function(err){
		if(err) sails.log.warn(err);

	});
});

/**
 * Description
 * @method readFile
 * @param {} name
 * @param {} callback
 * @return 
 */
function readFile(name,callback) {
	callback = callback || function(){};
	
	require('fs').readFile(sails.config.scripts.folder + '/' + name,'utf8', function(err,data){
			if(err) return callback('ScriptService, readFile(), error : ' + err);
			
			callback(null, data);
		});
}


module.exports = {

	/**
	 * Description
	 * @method exec
	 * @param {} name
	 * @param {} callback
	 * @return 
	 */
	exec:function(name, callback){
		callback = callback || function(){};

		if(!validFileName)
			return callback('Invalid file name', false);

		readFile(name, function(err, script){
				if(err) return callback(err);

				ScriptService.sandbox(script, function(err){
					if(err) return callback(err);
					
					callback(null);
				});
		});
	},

	/**
	 * Description
	 * @method sandbox
	 * @param {} codeJS
	 * @param {} callback
	 * @return 
	 */
	sandbox:function(codeJS, callback){
		callback = callback || function(){};
		
		try{
			var script = new vm.Script(codeJS, sails.config.scripts.vmOptions);
			script.runInNewContext(sandbox);
			callback(null);
		}catch(e){
			if(callback){
				sails.log.warn('In script error ' + e);
				callback(e);
			}
		}
	},


};