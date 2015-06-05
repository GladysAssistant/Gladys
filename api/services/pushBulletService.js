/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

var PushBullet = require('pushbullet');

/**
 * Send a PushBullet Notification
 * @method sendPushBullet
 * @param {} parametres
 * @param {} accessToken
 * @param {} callback
 * @return 
 */
function sendPushBullet (parametres, accessToken, callback) {
		var pusher = new PushBullet(accessToken);
		if(parametres.type == 'note'){
			pusher.note(null, parametres.title, parametres.body, callback);
		}else if(parametres.type == 'link'){
			pusher.link(null, parametres.title, parametres.url, callback);
		}else if(parametres.type == 'address'){
			pusher.address(null, parametres.title, parametres.address, callback);
		}else if(parametres.type == 'list'){
			pusher.address(null, parametres.title, parametres.items, callback);
		}else{
			callback(null);
		}
}

/**
 * Save in the database the pushBullet Notification
 * @method savePushBullet
 * @param {} pushBulletNotificationObj
 * @param {} callback
 * @return 
 */
function savePushBullet (pushBulletNotificationObj, callback) {
	PushbulletNotification.create(pushBulletNotificationObj, function(err, pushBulletNotification) {
		if (err) return callback('PushBulletService : savePushBulletNote : ' + err);

		callback(null);
	});
}

/**
 * Description
 * @method findPushBulletParametres
 * @param {} userId
 * @param {} callback
 * @return 
 */
var findPushBulletParametres = function(userId, callback) {
	PushBulletParametre.findOne({
		user: userId
	}, function(err, pushbulletParametre) {
		if (err) return callback('PushBulletService : findPushBulletParametres : ' + err);

		if (!pushbulletParametre) return callback('PushBulletService : findPushBulletParametres : User does not have a saved token ');
				
		callback(null, pushbulletParametre);
	});
};


module.exports = {

	/**
	 * Description
	 * @method sendNotificationUser
	 * @param {} userId
	 * @param {} notificationId
	 * @param {} title
	 * @param {} body
	 * @param {} callback
	 * @return 
	 */
	sendNotificationUser: function(userId, notificationId, title, body, callback) {
		findPushBulletParametres(userId, function(err, pushbulletParametre) {
			if(err) return callback(err);
			
			var parametres = {
				type: 'note',
				title: title,
				body: body
			};
			
			sendPushBullet(parametres, pushbulletParametre.token, function(err) {
				if (err) return callback('PushBulletService : sendNotificationUser : Fails to send pushBullet Notification' + err);

				var pushBulletNotificationObj = {
					type: 'note',
					title: title,
					body: body,
					notification: notificationId
				};

				savePushBullet(pushBulletNotificationObj, callback);
			});
		});
	},

	/**
	 * Description
	 * @method sendLinkUser
	 * @param {} userId
	 * @param {} notificationId
	 * @param {} title
	 * @param {} body
	 * @param {} url
	 * @param {} callback
	 * @return 
	 */
	sendLinkUser: function(userId, notificationId, title, body, url, callback) {
		findPushBulletParametres(userId, function(pushbulletParametre) {
			var parametres = {
				type: 'link',
				title: title,
				body: body,
				url: url
			};
			sendPushBullet(parametres, pushbulletParametre.token, function(err) {
				if (err) return callback('PushBulletService : sendLinkUser : Fails to send pushBullet Notification');

				var pushBulletNotificationObj = {
					type: 'note',
					title: title,
					body: body,
					url: url,
					notification: notificationId
				};

				savePushBullet(pushBulletNotificationObj, callback);
			});
		});
	},

	/**
	 * Description
	 * @method sendListUser
	 * @param {} userId
	 * @param {} title
	 * @param {} items
	 * @param {} callback
	 * @return 
	 */
	sendListUser: function(userId, title, items, callback) {
		findPushBulletParametres(userId, function(pushbulletParametre) {
			var parametres = {
				type: 'list',
				title: title,
				items: items
			};
			sendPushBullet(parametres, pushbulletParametre.token, function(err) {
				if (err) return sails.log.warn('PushBulletService : sendListUser : Fails to send pushBullet Notification');

				var pushBulletNotificationObj = {
					type: 'list',
					title: title,
					items: items,
					notification: notificationId
				};

				savePushBullet(pushBulletNotificationObj, callback);
			});
		});
	},

	/**
	 * Description
	 * @method sendAddressUser
	 * @param {} userId
	 * @param {} name
	 * @param {} address
	 * @param {} callback
	 * @return 
	 */
	sendAddressUser: function(userId, name, address, callback) {
		findPushBulletParametres(userId, function(pushbulletParametre) {
			var parametres = {
				type: 'address',
				name: name,
				address: address
			};
			sendPushBullet(parametres, pushbulletParametre.token, function(err) {
				if (err) return sails.log.warn('PushBulletService : sendAddressnUser : Fails to send pushBullet Notification');

				var pushBulletNotificationObj = {
					type: 'address',
					title: name,
					address: address,
					notification: notificationId
				};

				savePushBullet(pushBulletNotificationObj, callback);
			});
		});
	}

};