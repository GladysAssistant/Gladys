/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
// config/googleapi.js
module.exports.googleapi = {

	  consumer_key: process.env.GOOGLE_API_KEY || 'YOUR_CONSUMER_KEY',
	  consumer_secret: process.env.GOOGLE_API_SECRET || 'YOUR_CONSUMER_SECRET',
	  scope: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.modify','https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email']

};