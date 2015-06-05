/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * CalendarEventController
 *
 * @description :: Server-side logic for managing Calendarevents
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Get Calendar events which are happening on the POST param "date"
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	index: function(req, res, next) {

		var request = "SELECT calendarevent.summary, CONCAT( DATE_FORMAT(start,'%H:%i'), '-',DATE_FORMAT(end,'%H:%i') ) AS period FROM calendarevent ";
		request += " JOIN calendarlist ON (calendarevent.calendar = calendarlist.id) ";
		request += " WHERE user = ? AND DATE(start) >= DATE(?) AND DATE(end) <= DATE(?)";

		CalendarEvent.query(request, [req.session.User.id, req.param('date'), req.param('date')], function(err, data) {
			if (err) return res.json(err);

			res.json(data);
		});
	},
	
	/**
	 * Return the next event with Google maps traffic prediction
	 */
	getNextEvent: function(req, res,next){
		var request = "SELECT calendarevent.summary, calendarevent.start, calendarevent.end, calendarevent.location  FROM calendarevent ";
		request += " JOIN calendarlist ON (calendarevent.calendar = calendarlist.id) ";
		request += " WHERE user = ? AND start >= SYSDATE() AND start <= date_add(now(), INTERVAL 1 day) ";
		request += " ORDER BY start ";

		CalendarEvent.query(request, [req.session.User.id], function(err, data) {
			if (err) return res.json(err);
			
			if(data[0] && data[0].location){
				LocationService.lastPreciseLocation(req.session.User.id,sails.config.googlegeocoder.localisationValidityTime, function(err, userLocation){
					if(err) return res.json(data);
					
					var start = userLocation.latitude + "," + userLocation.longitude;
					GoogleMapsService.itineraryTime(start, data[0].location, function(err, duration){
						if(err) return res.json(data);
						
						data[0].traffic = duration;
						
						var arrivalTime = new Date();
						arrivalTime.setSeconds(arrivalTime.getSeconds() + duration);
						data[0].arrivalTime = arrivalTime;
						
						if(data[0].arrivalTime > data[0].start){
							data[0].sentence = req.__('According to the traffic, you are going to be late.');
						}else{
							data[0].sentence = req.__('According to the traffic, you will be on time.');
						}
						return res.json(data);
					});
				});
			}else{
				res.json(data);
			}
		});
	}

};