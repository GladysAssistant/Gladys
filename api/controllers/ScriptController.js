/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/**
 * ScriptController
 * @description :: Server-side logic for managing Scripts
 * @help :: See http://links.sailsjs.org/docs/controllers
 * @method validFileName
 * @param {} name
 * @return CallExpression
 */
function validFileName(name){
	var reg = /[a-zA-Z0-9]+\.js$/;
	return reg.test(name)
}

function stringifyError (err, filter, space) {
  var plainObject = {};
  Object.getOwnPropertyNames(err).forEach(function(key) {
    plainObject[key] = err[key];
  });
  return JSON.stringify(plainObject, filter, space);
}

module.exports = {

	/**
	 * Get all Scripts
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index:function(req,res,next){
		// returning all the files from the script folder
		require('fs').readdir(sails.config.scripts.folder, function(err, files){
			if(err) return res.json(err);
			
			var objectFile = [];
			for(var i = 0;i<files.length;i++){
				// Check if the file is a JS file
				if(validFileName(files[i])){
					objectFile.push({name : files[i], id: files[i]});	
				}
			}
			
			res.json(objectFile);
		});
	},

	/**
	 * Get the content of a given script
	 * @method get
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	get:function(req,res,next){

		// if no name param is given
		if(!req.param('name'))
			return res.json('Missing parametres');
		
		// testing if the file name is a file with only letters
		// and finishing with '.js'
		// ( To prevent looking for a file in a parent folder with ../ for example )
		if(!validFileName(req.param('name')))
			return res.json('Wrong filename');

		// reading file
		require('fs').readFile(sails.config.scripts.folder + '/' + req.param('name'),'utf8', function(err,data){
			if(err) return res.json(err);
			var file = {
				name: req.param('name'),
				content:data
			};
			res.json(file);
		});
	},

	/**
	 * Save a script
	 * @method put
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	put: function(req,res,next){

		// if no name param is given
		if(!req.param('name')){
			return res.json('Missing parametres');
		}
		
		var content = '';
		// if content is given
		if(req.param('content')){
			content = req.param('content');
		}

		// if the name param is not a valid fileName
		if(!validFileName(req.param('name')))
			return res.json('Wrong filename');


		// write file with the content param
		require('fs').writeFile(sails.config.scripts.folder + '/' + req.param('name') , content , 'utf8' , function(err){
			if (err) return res.json(err);

			res.json('ok');
		});

	},
	
	run: function(req,res,next){
		// if no name param is given
		if(!req.param('name'))
			return res.json('Missing parametres');
			
		ScriptService.exec(req.param('name'), function(err){
			if(err) return res.send(stringifyError(err, null, '\t'));
			
			return res.json('ok');
		});
	},

	/**
	 * Delete a Script
	 * @method delete
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy: function(req,res,next){
		// if no name param is given
		if(!req.param('name'))
			return res.json('Missing parametres');

		if(!validFileName(req.param('name')))
			return res.json('Wrong filename');

		require('fs').unlink(sails.config.scripts.folder + '/' + req.param('name') , function (err) {
		  if (err) return res.json(err);
		 
		  res.json('ok');
		});

	}
};

