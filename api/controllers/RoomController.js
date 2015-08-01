/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * RoomController
 * @description :: Server-side logic for managing rooms
 * @help :: See http://links.sailsjs.org/docs/controllers
 */

 /**
 * Test if the user is allowed to get/modify the room
 * @method haveRights
 * @param {} user
 * @param {} room
 * @param {} callback
 * @return 
 */
function haveRights (user,room,callback){
	Room.findOne({id:room}, function(err, room){
		if(err) callback(err);

		if(!room){
			callback(false,false);
		}else{
			UserHouseRelation.findOne({house: room.house, user: user, userhouserelationtype: sails.config.userhouserelationtype.Admin }, function(err, userHouseRelation){
		          if(err) callback(err);

		          if(!userHouseRelation){
		              callback(false, false);
		          }else{
		              callback(false,true);
		          }
		     	});
		}
	});
     
}

module.exports = {

	
	/**
	* Get all the rooms
	* @method index
	* @param {} req
	* @param {} res
	* @param {} next
	* @return 
	*/
	index : function(req,res, next){
		var request = "SELECT room.id, CONCAT(room.name, ' - ', house.name) AS name, house.name AS house FROM room ";
		request+= "JOIN house ON (room.house = house.id) ";
		request+= "WHERE room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
		request+= "AND user = ? )";
		Room.query(request, [req.session.User.id], function(err, rooms){
			if(err) return res.json(err);

			res.json(rooms);
		});	
	},

	/**
	* Create a room
	* @method create
	* @param {} req
	* @param {} res
	* @param {} next
	* @return 
	*/
	create : function (req, res, next){

	  	var roomObj = {
	      name: req.param('name'),
	      house: req.param('house')
	    };

  		Room.create(roomObj, function roomCreated(err,Room){
  			if(err) res.json(err);
  			
  			res.json(Room);
  		});
  	},


  	/**
  	 * Destroy a Room
  	 * @method destroy
  	 * @param {} req
  	 * @param {} res
  	 * @param {} next
 	  * @return 
 	  */
 	destroy : function(req,res,next){
  		haveRights(req.session.User.id, req.param('id'), function(err, right){
  			if(err) return res.json(err);

	  		if(right){
	  			Room.destroy(req.param('id'), function roomDestroyed(err, room){
					if(err) return res.json(err);

					res.json(room);
				});
	  		}else{
	  			res.forbidden('You are not allowed to delete this room');
	  		}
  		});
  	},

	/**
	 * Description
	 * @method roomName
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	roomName : function(req,res,next){
		var request = "SELECT room.id, room.name AS name, house.name AS house FROM room ";
		request+= "JOIN house ON (room.house = house.id) ";
		request+= "WHERE room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
		request+= "AND user = ? )";
		Room.query(request, [req.session.User.id], function(err, rooms){
			if(err) return res.json(err);

			res.json(rooms);
		});	
	},

	/**
	 * Get all the room where the user sleep
	 * @method getSleepIn
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	getSleepIn: function(req,res,next){
		var request = "SELECT room.id AS roomId, CONCAT(room.name, ' - ', house.name) AS roomName, user.id AS userId , CONCAT(user.firstname, ' ', user.lastname) as userName ";
		request+= "FROM room_sleepers__user_roomwheresleep ";
		request+= "JOIN room ON (room_sleepers = room.id) ";
		request+= "JOIN house ON (room.house = house.id) ";
		request+= "JOIN user ON (user_roomwheresleep = user.id) ";
		request+= "WHERE room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
		request+= "AND user = ? )";
		Room.query(request, [req.session.User.id],function(err, relations){
			if(err) return res.json(err);

			res.json(relations);
		});

	},

	/**
	 * Define where the user Sleep
	 * @method defineSleepIn
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	defineSleepIn: function(req,res,next){
		User.findOne(req.param('user')).exec(function(err, user) {
		  if(err) return res.json(err);

		  // Queue up a new pet to be added and a record to be created in the join table
		  user.roomwheresleep.add(req.param('room'));

		  // Save the user, creating the new pet and syncing the associations in the join table
		  user.save(function(err) {
		  		if(err) return res.json(err);

		  		res.json(user);
		  });
		});
	},

	/**
	 * Destroy the "sleepIn" relation between a room and a user
	 * @method destroySleepIn
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroySleepIn: function(req,res,next){
		User.findOne(req.param('user')).exec(function(err, user) {
		  if(err) return res.json(err);

		  // Queue up a join table record to remove
		  user.roomwheresleep.remove(req.param('room'));

			// Save the user, creating the new pet and syncing the associations in the join table
			user.save(function(err) {
			  	if(err) return res.json(err);

			  	res.json(user);
			});

		});
	},

};

