/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
// /service/Oauth2InfosService.js


var google = require('googleapis');
var oauth2 = google.oauth2('v2');
var OAuth2Client = google.auth.OAuth2;
var oauth2Client = new OAuth2Client( sails.config.googleapi.consumer_key , sails.config.googleapi.consumer_secret , sails.getBaseurl() + '/googleapi/create');

/**
 * Description
 * @method getInfos
 * @param {} access_token
 * @param {} refresh_token
 * @param {} callback
 * @return 
 */
var getInfos = function (access_token,refresh_token,callback){

	oauth2Client.setCredentials({
		 access_token: access_token,
		refresh_token: refresh_token
	});

	var params = {auth: oauth2Client};

	oauth2.userinfo.get(params,function(err, infos){
		if(err) return sails.log.warn(err);

		if(callback)
			callback(infos);
	});
};

/**
 * Description
 * @method saveInfos
 * @param {} infos
 * @param {} GoogleApiId
 * @return 
 */
var saveInfos = function(infos, GoogleApiId){
	var GoogleApiObj = {
		email : infos.email
	};
	GoogleApi.update({id:GoogleApiId }, GoogleApiObj, function(err,GoogleApi){
		if(err) return sails.log.warn(err);
	});
};



module.exports = {

	/**
	 * Description
	 * @method getInfos
	 * @param {} GoogleApiId
	 * @param {} access_token
	 * @param {} refresh_token
	 * @return 
	 */
	getInfos : function(GoogleApiId,access_token,refresh_token){
		getInfos(access_token, refresh_token, function(infos){
				saveInfos(infos,GoogleApiId);
		});
	}
};