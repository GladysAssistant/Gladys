/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/**
 * UserService : 
 * 
 */

module.exports = {
	
	/**
	 * Description
	 * @method goToSleep
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	goToSleep: function(userId, callback){
		User.update({id:userId}, {isSleeping : true}, function(err, user){
			if(err) return callback(err);

			// save goingToSleep Event in LifeEvents database 
			LifeEventService.saveEvent(sails.config.lifeevent.goingToSleep.name,userId, null,function(err){
				if(err) return callback(err);

				callback(null);
			});
		});
	},

	/**
	 * Description
	 * @method wakeUp
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	wakeUp: function(userId, callback){
		User.update({id:userId}, {isSleeping : false}, function(err, user){
			if(err) return callback(err);

			// save WakeUp Event in LifeEvents database 
			LifeEventService.saveEvent(sails.config.lifeevent.wakeUp.name,userId, null,function(err){
				if(err) return callback(err);

				callback(null);
			});
		});
	},

	/**
	 * Description
	 * @method isSleeping
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	isSleeping : function(userId, callback){
		User.findOne({id:userId}, function(err, user){
			if(err) return callback(err);

			// if user exist
			if(user){
				// callback his actual sleepingState
				callback(null, user.isSleeping);
			}else
				callback('UserService : isSleeping : No user found');
		});
	},

	/**
	 * Description
	 * @method getUsersOneCanControl
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	getUsersOneCanControl : function(userId, callback){
		var request = 'SELECT DISTINCT user.id, user.firstname, user.lastname FROM user ';
		request += 'JOIN userhouserelation ON (user.id = userhouserelation.user) ';
		request += 'WHERE userhouserelation.house IN ( SELECT house FROM userhouserelation ';
		request += 'WHERE user = ? ';
		request += 'AND userhouserelationtype = ? ) ';
		request += 'AND user.id != ?';

		User.query(request, [userId, sails.config.userhouserelationtype.Admin, userId], function(err, users){
			if(err) return callback(err);

			callback(null, users);
		});
	},

};