/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

module.exports = {

	/**
	 * Description
	 * @method getHouseWhereUserAdmin
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	getHouseWhereUserAdmin: function(userId, callback){
		var request = 'SELECT house FROM userhouserelation ';
		request += 'WHERE user = ? '
		request += 'AND userhouserelationtype = ?';

		UserHouseRelation.query(request, [userId, sails.config.userhouserelationtype.Admin], function(err, houses){
			if(err) return callback(err);

			callback(null, houses);
		});
	},

	/**
	 * Description
	 * @method isEmptyWithMotion
	 * @param {} houseId
	 * @param {} callback
	 * @return 
	 */
	isEmptyWithMotion : function(houseId, callback){
		// select motions where motions in the room happened less than timeBeforeEmpty
		var request = 'SELECT motion.id FROM motion ';
		request += 'JOIN motionsensor ON (motion.motionsensor = motionsensor.id) ';
		request += 'JOIN room ON (motionsensor.room = room.id) ';
		request += 'WHERE room.house = ? ';
		request += 'AND (TO_SECONDS( SYSDATE() ) - TO_SECONDS(motion.datetime) ) < timebeforeempty ';

		Motion.query(request,[houseId], function(err, motions){
			if(err) return callback(err);

			callback(null, (motions.length == 0))
		});
	},

	/**
	 * Description
	 * @method numberOfHabitant
	 * @param {} houseId
	 * @param {} callback
	 * @return 
	 */
	numberOfHabitant: function(houseId, callback){
		UserHouseRelation.find({house:houseId})
						 .exec(function(err, userHouseRelations){
				if(err) return callback(err);

				callback(null, userHouseRelations.length);
		});
	},

	/**
	 * Description
	 * @method atHome
	 * @param {} userId
	 * @param {} houseId
	 * @param {} callback
	 * @return 
	 */
	atHome: function(userId, houseId ,callback){
		User.update({id : userId}, {atHome:houseId}, function(err, user){
			if(err) return callback(err);

			ScenarioService.launcher(sails.config.lifeevent.backAtHome.name, userId);
			callback(null, user);
		});
	},

	/**
	 * Description
	 * @method leftHome
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	leftHome: function(userId, callback){
		User.update({id : userId}, {atHome:null}, function(err, user){
			if(err) return callback(err);

			ScenarioService.launcher(sails.config.lifeevent.leftHome.name, userId);
			callback(null, user);
		});
	},

	/**
	 * Description
	 * @method whoIsAtHome
	 * @param {} houseId
	 * @param {} callback
	 * @return 
	 */
	whoIsAtHome: function(houseId, callback){
		House.findOne({id:houseId})
			 .populate('usersInside')
			 .exec(function(err, house){
			if(err) return callback(err);

			if(house)
				callback(null, house.usersInside);
			else
				callback('whoIsAtHome : Can\'t find house');
		});
	},

	/**
	 * Description
	 * @method whichHomeIsUser
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	whichHomeIsUser: function(userId, callback){
		User.findOne({id:userId}, function(err,user){
			if(err) return callback(err);

			if(user)
				callback(null, user.atHome);
			else
				callback('whichHomeIsUser : Can\'t find user');
		});
	},

	/**
	 * Get the number of habitant of the house who can possibly be at home (based on last know location)
	 * @method habitantsWhoCanBeAtHome
	 * @param {} houseId
	 * @param {} callback
	 * @return 
	 */
	habitantsWhoCanBeAtHome: function(houseId, callback){

		// first, we find all the people linked to the house
		UserHouseRelation.find({house:houseId})
						 .populate('house')
						 .exec(function(err, userHouseRelations){
				if(err) return callback(err);

				var userPossiblyAtHome = [];

				async.each(userHouseRelations, function(userHouseRelation, callback){
						var user = userHouseRelation.user;
						var latitude = userHouseRelation.house.latitude;
						var longitude = userHouseRelation.house.longitude;
						var range = sails.config.googlegeocoder.rangeMax;

						LocationService.isUserInArea(user, latitude, longitude, range, function(err, result){
							// in case of error while locating the user, we consider he can be at home
							if(result || err)
								userPossiblyAtHome.push(user);

							callback();	
						});


				}, function(err){
				    if(err) return callback(err);

				    callback(null, userPossiblyAtHome);
				});
		});
	},

	/**
	 * Useful to know if the user is in one of his house, and can tell in which house he is
	 * Calculate in which house the user is with 2 methods :
	 * 1) First, we check how many people can possibly be in each house the user is link with...
	 * 				=> Because if the man we are looking for is the only one who can be in this house
	 * 											(because his sister is in holidays faaaar away for example!)
	 * 											(or because he is the only habitant of this house)
	 * 					=> SO, if we have seen a motion 5 minutes ago, and our man is not so far away, 
	 * 						that mean that the motion is only due to our man 
	 * 						(for animals, we must create an account for them to tell Gladys they are at home)
	 * 2) If the whole family can be at home, we just see if the last location of our man is not so far away from the house
	 * @method isUserInOneofHisHouse
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	isUserInOneofHisHouse: function(userId, callback){
		// find all the houses where the user is linked with
		UserHouseRelation.find({user:userId})
						 .populate('house')
						 .exec(function(err, userHouseRelations){

				if(err) return callback(err);

				// if the user has no houses.. he is not a home because he has no one, so callback false
				if(userHouseRelations.length == 0) return callback(null, false);

				// houseWhereHeIs will store the result
				var houseWhereHeIs = null;

				// foreach house, we check if the user is at home
				async.each(userHouseRelations, function(userHouseRelation, callback){
						HouseService.habitantsWhoCanBeAtHome(userHouseRelation.house.id, function(err, userPossiblyAtHome){
							// if no user can possibly be at home, there is nobody there
							if(userPossiblyAtHome.length == 0)
								callback();
							// else if there is only one user at home
							else if(userPossiblyAtHome.length == 1){
								HouseService.isEmpty(userHouseRelation.house.id, function(err, empty){
									if(err) return callback(err);

									if(!empty){
										houseWhereHeIs = userHouseRelation.house;
										callback();
									}else{
										callback();
									}
								});
							}

							if(!houseWhereHeIs){	
								var latitude = userHouseRelation.house.latitude;
								var longitude = userHouseRelation.house.longitude;
								var range = sails.config.googlegeocoder.rangePrecision;
								LocationService.isUserInArea(userId,latitude, longitude, range, function(err, inArea){
									if(err) return callback(err);

									if(inArea){
										houseWhereHeIs = userHouseRelation.house;
										callback();
									}else
										callback();
								});
							}
						});
				 
				}, function(err){
					if(err) return callback(err);

					callback(null, houseWhereHeIs);
				});
		});
	},

};