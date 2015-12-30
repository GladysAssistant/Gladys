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
	 * Description
	 * @method newNotification
	 * @param {} title
	 * @param {} content
	 * @param {} priority
	 * @param {} icon
	 * @param {} iconColor
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	newNotification : function(title, content, priority, icon, iconColor,userId, callback) {
		var NotificationObj = {
			title: title,
			content:content,
			priority:priority,
			icon:icon,
			iconColor: iconColor,
			user: userId
		};

	    Notification.create(NotificationObj,function NotificationCreated(err, notification){
			if(err) return callback(err);
			
			gladys.emit('notification', notification);
			 		
		 	SocketService.sendDesktopMessageUser(userId, 'newNotification' , notification, function(err, nbOfMsgSent){
				 if(err) return callback(err);
				 
				 if(nbOfMsgSent === 0){
					 //pushBulletService.sendNotificationUser(notification.user, notification.id, notification.title, notification.content, callback);
				 }else{
					 callback(null);
				 }
			 });
		});

	}


};

