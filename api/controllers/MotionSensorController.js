/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * MotionSensorController
 * @description :: Server-side logic for managing Motionsensors
 * @help :: See http://links.sailsjs.org/docs/controllers
 */

 /**
 * Test if the user is allowed to get/modify a motion Sensor
 * @method hasRights
 * @param {} userId
 * @param {} room
 * @param {} callback
 * @return 
 */
var hasRights = function(userId, room,callback){
	var request = "SELECT room.id FROM room ";
		request += " JOIN house ON (room.house = house.id ) ";
		request+= " WHERE room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
		request+= " AND user = ? ) ";
		request+= "AND room.id = ?";

		Room.query(request,[userId, room], function(err, room){
			if(err) return callback(false);

			callback(room.length > 0);
		});
};


module.exports = {

	
	/**
	 * Get all motion sensors
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index : function(req,res,next){
		var request = "SELECT motionsensor.id, motionsensor.name AS name, motionsensor.code, CONCAT(room.name,' - ', house.name) AS room FROM motionsensor ";
		request+= "JOIN room ON (motionsensor.room = room.id ) ";
		request+= "JOIN house ON (room.house = house.id ) ";
		request+= "WHERE room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
		request+= "AND user = ? )";
		MotionSensor.query(request, [req.session.User.id], function(err, Sensors){
			if(err) return res.json(err);

			res.json(Sensors);
		});
	},

	/**
	 * Create a new motion sensor
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create: function(req,res,next){

		hasRights(req.session.User.id, req.param('room'), function(ok){
			if(ok){
				var motionSensorObj = {
					code:req.param('code'),
					name:req.param('name'),
					room:req.param('room')
				};

				MotionSensor.create(motionSensorObj, function(err, motionSensor){
						if(err) return res.json(err);

						res.json(motionSensor);
				});
			}else{
				return res.forbidden('You are not allowed to touch this house');
			}
		});
	},

	/**
	 * Destroy a motion Sensor
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy: function(req,res,next){
		MotionSensor.findOne({id:req.param('id')}, function(err, motionSensor){
				if(err) return res.json(err);

				hasRights(req.session.User.id, motionSensor.room, function(ok){
					if(ok){
						MotionSensor.destroy({id:req.param('id')}, function(err, motionSensor){
							if(err) return res.json(err);

							res.json(motionSensor);
						});
					}else{
						return res.forbidden('You are not allowed to touch this house');
					}
				});
		});
	},

	/**
	 * Start waiting for a new motion sensor to connect
	 * @method startWaitingForConnection
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	startWaitingForConnection : function(req,res,next){

		// if request is not a socket, bad request
		if (!req.isSocket) return res.badRequest();

		// Get socket Id
		var socketId = sails.sockets.id(req.socket);

		RFListenerService.switchToWaitingMode(socketId);

		// giving the time avalaible to configure a sensor
		res.json({ waitTime: sails.config.serialport.waitingForConnectionTime});
	},
	
};

