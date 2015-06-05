/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
var google = require('googleapis');
var oauth2 = google.oauth2('v2');
var OAuth2Client = google.auth.OAuth2;
var oauth2Client = new OAuth2Client( sails.config.googleapi.consumer_key , sails.config.googleapi.consumer_secret , sails.getBaseurl() + '/googleapi/create');
var GoogleContacts = require('google-contacts').GoogleContacts;


/**
 * EXPERIMENTAL
 * @method test
 * @return 
 */
function test(){
GoogleApi.findOne({user: 1}, function(err, googleapi){
	if(err) return callback(err);

	if(googleapi){ // token found
		oauth2Client.setCredentials({
		 	access_token: googleapi.access_token,
			refresh_token: googleapi.refresh_token
		});

		oauth2Client.refreshAccessToken(function(err, tokens) {
			if(err) return sails.log.warn(err);


		});
		  			
				  			
	}else{
		sails.log.warn('no token');
	}

});

}

//setTimeout(test, 3000);

module.exports = {


};