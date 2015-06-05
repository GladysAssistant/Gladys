/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * NotificationController
 *
 * @description :: Server-side logic for managing Notifications
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


var numberNotificationToGet = 10;

module.exports = {

	create: function(req, res, next){
		NotificationService.newNotification(req.param('title'), req.param('content'), req.param('priority'),req.param('icon'),req.param('iconcolor'), req.session.User.id, function(err){
			if(err) return res.json(err);
			
			return res.json("ok");
		});	
	},
	
	
	/**
	 * Get the last Notifications
	 * @method getLastNotification
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	getLastNotification : function(req,res,next) {
		
		Notification.find({
  		user : req.session.User.id,
  		sort: 'createdAt DESC',
  		limit: numberNotificationToGet }, function(err, Notifications) {
  			Notification.update({isRead : false, user: req.session.User.id}, { isRead : true}, function NotificationUpdated(err, Notification_modif){
				if(err) return res.json(err);
				
				res.json(Notifications);
			});
	
		});

	}
	
};

