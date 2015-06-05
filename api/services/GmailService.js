/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

  
var google = require('googleapis');
var gmail = google.gmail('v1');
var oauth2 = google.oauth2('v2');
var OAuth2Client = google.auth.OAuth2;
var oauth2Client = new OAuth2Client(sails.config.googleapi.consumer_key , sails.config.googleapi.consumer_secret , sails.getBaseurl() + '/googleapi/create');

var ejs = require('ejs');
var fs = require('fs');
var async = require('async');

/**
 * EXPERIMENTAL
 * Get mails from a gmail account
 * @method getGmail
 * @param {} access_token
 * @param {} refresh_token
 * @param {} email
 * @return 
 */
function getGmail (access_token,refresh_token,email){

	oauth2Client.setCredentials({
		 access_token: access_token,
		refresh_token: refresh_token
	});

	var params = {auth: oauth2Client, userId:email};

	gmail.users.messages.list(params, function(err, messagesList){
		if(err) return sails.log.warn(err);

		console.log(messagesList);
		/*for(var i = 0;i<messagesList.items.length;i++){

				
		}*/
	
	});
}

/**
 * Send a mail with Gmail
 * @method sendMail
 * @param {} senderMail
 * @param {} senderName
 * @param {} receiverMail
 * @param {} subject
 * @param {} message
 * @param {} access_token
 * @param {} refresh_token
 * @param {} callback
 * @return 
 */
function sendMail (senderMail, senderName, receiverMail,subject, message, access_token, refresh_token,callback){
	
	// write mail
	var email_lines = [];
	email_lines.push("From: \"" + senderName + "\" <"+ senderMail+">");
	email_lines.push("To: "+receiverMail);
	email_lines.push('Content-type: text/html;charset=iso-8859-1');
	email_lines.push('MIME-Version: 1.0');
	email_lines.push("Subject: "+subject);
	email_lines.push("");
	email_lines.push(message);

	var email =email_lines.join("\r\n").trim();

	// encode mail to base64
	var base64EncodedEmail = new Buffer(email).toString('base64');
	base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');

	oauth2Client.setCredentials({
		access_token: access_token,
		refresh_token: refresh_token
	});

	// send mail
	gmail.users.messages.send({
		auth: oauth2Client,
		userId: senderMail,
		resource: 
		{
		    raw: base64EncodedEmail
		}           
	},callback);

	/*oauth2Client.refreshAccessToken(function(err, tokens) {
		if(err) return sails.log.warn(err);
			
		
	});*/
}



module.exports = {

	/**
	 * Sync Gmail mails
	 * @method syncMail
	 * @return 
	 */
	syncMail : function(){
			GoogleApi.find()
					 .exec(function foundGoogleApi(err, GoogleApis){
					 	if(err) return sails.log.warn(err);

					 	for(var i = 0;i<GoogleApis.length;i++){
					 		getGmail(GoogleApis[i].access_token,GoogleApis[i].user,GoogleApis[i].email);
					 	}
				
				});

		
	},

	/**
	 * Send an Email
	 * @method sendMail
	 * @param {} senderMail
	 * @param {} senderName
	 * @param {} receiverMail
	 * @param {} subject
	 * @param {} message
	 * @param {} access_token
	 * @param {} refresh_token
	 * @param {} callback
	 * @return 
	 */
	sendMail: function(senderMail, senderName, receiverMail,subject, message, access_token, refresh_token, callback){
		sendMail(senderMail, senderName, receiverMail,subject, message, access_token, refresh_token, callback);	
	},

	/**
	 * Send an email with a given template
	 * Fill the template with the given datas (EJS injection in the template)
	 * @method sendMailTemplate
	 * @param {} userId
	 * @param {} senderMail
	 * @param {} receiverMail
	 * @param {} subject
	 * @param {} templateName
	 * @param {} data
	 * @param {} callback
	 * @return 
	 */
	sendMailTemplate : function(userId, senderMail, receiverMail, subject, templateName, data, callback){
		User.findOne({id:userId}, function(err, user){
			if(err) return callback(err);

			// if user exist
			if(user){
				// read template file
				fs.readFile(sails.config.mailtemplates.path + templateName + '.' + sails.config.mailtemplates.extension , 'utf8', function (err,content) {
				  // if err while reading template file
				  if (err) return callback(err);

				  // render template with EJS
				  var options = {};

				  // get all the informations and inject thme
				  async.parallel({
					    /**
    					 * Description
    					 * @method user
    					 * @param {} callback
    					 * @return 
    					 */
    					user: function(callback){
					        User.findOne({id:userId}, function(err, user){
					        	if(!user) return callback('User not found');

					        	data.user = {};
					        	data.user.firstname = user.firstname;
					        	data.user.lastname = user.lastname;
					        	data.user.email = user.email;
					        	data.user.birthdate = user.birthdate;
					        	data.user.gender = user.gender;
					        	data.user.language = user.language;
					        	data.user.preparationTimeAfterWakeUp = user.preparationTimeAfterWakeUp;
					        	data.user.assistantName = user.assistantName;

					        	callback(null,true);
					        });	
					    },

					    /**
    					 * Description
    					 * @method actualTime
    					 * @param {} callback
    					 * @return 
    					 */
    					actualTime:function(callback){
					    	data.actualTime = new Date();
					    	callback(null,true);
					    },

						/**
						 * Description
						 * @method lastLocation
						 * @param {} callback
						 * @return 
						 */
						lastLocation:function(callback){
							LocationService.lastPreciseLocation(userId,sails.config.googlegeocoder.localisationValidityTime, function(err, location){
								if(err) return callback(null,err);

					    		AddressToCoordinateService.reversegeocode(location.latitude, location.longitude, function(err, address){
					    				if(err) return callback(null,err);

					    				data.lastLocation = {};
					    				data.lastLocation.address = address;
					    				data.lastLocation.latitude = location.latitude;
					    				data.lastLocation.longitude = location.longitude;
					    				data.lastLocation.datetime = location.datetime;
					    				callback(null, true);
					    			});
								callback(null, true);

					    	});
					    },					    
					},
					function(err, results) {
					    if(err) return sails.log.warn(err);

					    console.log(results);
					    console.log(data);
					});

				  var html = ejs.render(content, data, options);
				 
				  // find GoogleApi tokens
				  GoogleApi.findOne({user: userId, email:senderMail}, function(err, googleapi){
				  		if(err) return callback(err);

				  		if(googleapi){ // token found
				  			// send mail
				  			//sendMail(senderMail, user.fullname(), receiverMail, subject, html, googleapi.access_token, googleapi.refresh_token,callback);
				  		}else{
				  			callback('Can\'t find GoogleApi token.');
				  		}

				  });
				 
				});
				
			}else{
				// if user does not exist
				callback('Can\'t find user');
			}
		});
	}



};