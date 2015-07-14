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
	 * A motion has been detected
	 * Save the code into the database
	 * @method motion
	 * @param {} code
	 * @param {} callback
	 * @return 
	 */
	motion: function(code,callback){
		MotionSensor.findOne({code : code}, function(err, motionSensor){
				if(err) return callback('MotionService : motion : ' + err);

				MotionObj = {
					motionsensor:motionSensor.id
				};
				Motion.create(MotionObj, function(err, motion){
					if(err) return callback('MotionService : motion : ' + err);

					// Trigger an event 'motion' with the value of the sensor
        			ScenarioService.launcher(sails.config.lifeevent.motion.name, code);
        			// Trigger an event 'motionRoom' with the value of the room where the sensor is
        			ScenarioService.launcher(sails.config.lifeevent.motionRoom.name, motionSensor.room);
        			callback(null);
				});
		});
	},

	/**
	 * Get the last motion in a room
	 * @method lastMotionRoom
	 * @param {} roomId
	 * @param {} callback
	 * @return 
	 */
	lastMotionRoom: function(roomId, callback){
		var request = 'SELECT * FROM motion ';
		request += 'JOIN motionsensor ON (motion.motionsensor = motionsensor.id) ';
		request += 'WHERE motionsensor.room = ? ';
		request += 'ORDER BY datetime DESC ';
		request += 'LIMIT 1';

		Motion.query(request,[roomId], function(err, motions){
			if(err) return callback(err);

			callback(null, motions);
		});
	},

	/**
	 * Description
	 * @method lastMotionHouse
	 * @param {} houseId
	 * @param {} callback
	 * @return 
	 */
	lastMotionHouse: function(houseId, callback){
		var request = 'SELECT * FROM motion ';
		request += 'JOIN motionsensor ON (motion.motionsensor = motionsensor.id) ';
		request += 'JOIN room ON (motionsensor.room = room.id) ';
		request += 'WHERE room.house = ? ';
		request += 'ORDER BY datetime DESC ';
		request += 'LIMIT 1';

		Motion.query(request,[houseId], function(err, motions){
			if(err) return callback(err);

			callback(null, motions);
		});
	},	


};