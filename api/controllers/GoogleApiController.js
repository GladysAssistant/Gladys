/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * GoogleApiController
 *
 * @description :: Server-side logic for managing Googleapis
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var oauth2Client = new OAuth2Client( sails.config.googleapi.consumer_key , sails.config.googleapi.consumer_secret , sails.getBaseurl() + '/googleapi/create');

module.exports = {
	
	
	/**
	 * Return all Google account connected
	 */
	index: function(req,res, next){
		GoogleApi.find({user:req.session.User.id})
				 .exec(function(err, googleapis){
					if(err) return res.json(err);
					
					return res.json(googleapis); 
				 });
	},

	/**
	 * Description
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function (req, res, next){

    var code = req.param('code');
	oauth2Client.getToken(code, function(err, tokens) {
				oauth2Client.setCredentials(tokens);
				var GoogleApiObj = {
			      refresh_token : tokens.refresh_token,
			      access_token: tokens.access_token,
			      user: req.session.User.id
			    };

			    GoogleApi.create(GoogleApiObj,function GoogleApiCreated(err,GoogleApi){
		  			if(err) return sails.log.warn(err);

		  			Oauth2InfosService.getInfos(GoogleApi.id,GoogleApi.access_token,GoogleApi.refresh_token);
		  			//res.json(tokens);
					return res.redirect('/dashboard/parametres');
		  		});

			});
  	},
	  
	destroy : function(req,res,next){
		GoogleApi.destroy({id:req.param('id')})
				.exec(function(err, googleApi){
					if(err) return res.json(err);
					
					return res.json(googleApi);
				});
	},

  	/**
	   * Description
	   * @method auth
	   * @param {} req
	   * @param {} res
	   * @param {} next
	   * @return 
	   */
	  auth : function (req,res,next){
	  	var url = oauth2Client.generateAuthUrl({
		    scope: sails.config.googleapi.scope ,
		    access_type: 'offline',
		    approval_prompt: 'force'
		  });
	      
	    res.redirect(url);
  	},

};

