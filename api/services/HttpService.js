/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

var request = require("request");

module.exports = {

	/**
	 * Make an HTTP request, and callback the body result of the request
	 * @method request
	 * @param {} url
	 * @param {} callback
	 * @return 
	 */
	request: function(url,callback){
		callback = callback || function(){};
		
		request(url, function(err, response, body) {
				if(err) return callback('HTTPService : Fail to load URL : ' + err);

				callback(null, response, body);
		});
	}

};