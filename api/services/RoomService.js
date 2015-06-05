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
	 * @method isEmpty
	 * @param {} roomId
	 * @param {} callback
	 * @return 
	 */
	isEmpty:function(roomId, callback){
		// select motions where motions in the room happened less than timeBeforeEmpty
		var request = 'SELECT motion.id FROM motion ';
		request += 'JOIN motionsensor ON (motion.motionsensor = motionsensor.id) ';
		request += 'JOIN room ON (motionsensor.room = room.id) ';
		request += 'WHERE motionsensor.room = ? ';
		request += 'AND (TO_SECONDS( SYSDATE() ) - TO_SECONDS(motion.datetime) ) < timebeforeempty ';

		Motion.query(request,[roomId], function(err, motions){
			if(err) return callback(err);

			callback(null, (motions.length == 0))
		});
	}
};