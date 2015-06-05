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
	 * Get calendar next event of a given user
	 * @method getNextEvent
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	getNextEvent: function(userId, callback){
		var request = "SELECT calendarevent.start, calendarevent.summary, calendarevent.location FROM calendarevent ";
		request += "JOIN calendarlist ON(calendarevent.calendar = calendarlist.id) ";
		request += "WHERE user = ? ";
		request += "AND start > SYSDATE() ";
		request += "AND calendarlist.active = 1 "
		request += "ORDER BY start ";
		request += "LIMIT 0,1 ";

		CalendarEvent.query(request, [userId], function(err, events){
			if(err) return callback(err);

			if(events.length > 0){
				return callback(null, events[0]);
			}else{
				return callback(null, null);
			}
		});
	},

};