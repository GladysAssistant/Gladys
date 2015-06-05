/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * Prefer using PushBullet instead, wich is free.
 */
 
var request = require("request");

module.exports = {

	/**
	 * Description
	 * @method sendNotification
	 * @param {} notification
	 * @return 
	 */
	sendNotification: function(notification) {
		request({
			uri: "https://api.pushover.net/1/messages.json",
			method: "POST",
			form: {
				title: notification.title,
				message: notification.content,
				priority: notification.priority,
				token: token,
				user: user
			}
		}, function(err, response, body) {

			if (err) return sails.log.warn("Fail to send Pushover notification : " + notification.title);
			var received = true;
			try {
				body = JSON.parse(body);
				if (body.status != 1) {
					received = false;
				}
			} catch (e) {
				received = false;
			}

			var PushoverNotificationObj = {
				datetime: new Date(),
				received: received,
				notification: notification.id
			};
			PushoverNotification.create(PushoverNotificationObj, function PushoverNotificationCreated(err, PushoverNotification) {
				if (err) return sails.log.warn("Fail to save Pushover notification : " + notification.title);
			});
		});

	}


};