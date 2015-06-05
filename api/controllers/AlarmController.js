/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * AlarmController
 *
 * @description :: Server-side logic for managing Alarms
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	/**
	 * Get all alarms
	 * @param  {[type]}
	 * @param  {[type]}
	 * @param  {Function}
	 * @return {[type]}
	 */
	index: function(req, res, next) {
		Alarm.find({
			user: req.session.User.id
		}, function(err, alarms) {
			if (err) return res.json(err);

			res.json(alarms);
		});
	},

	/**
	 * Create an Alarm
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	create: function(req, res, next) {
		var alarmObj = {
			name: req.param('name'),
			datetime: req.param('datetime'),
			time : req.param('time'),
			recurring: req.param('recurring'),
			user: req.session.User.id
		};
		
		AlarmService.create(alarmObj.name, alarmObj.datetime,alarmObj.time, alarmObj.recurring, alarmObj.user, function(err, alarm) {
				if (err) return res.json(err);
	
				return res.json(alarm);
			});
	},

	/**
	 * Update an Alarm
	 * @method update
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	update: function(req, res, next) {
		var alarmObj = {
			name: req.param('name'),
			date: req.param('date'),
			time: req.param('time'),
			recurring: req.param('recurring'),
			user: req.session.User.id
		};

		Alarm.update({
			id: req.param('id'),
			user: req.session.User.id
		}, alarmObj, function alarmUpdated(err, Alarm) {
			if (err) return res.json(err);

			res.json(Alarm);
		});
	},

	/**
	 * Destroy an Alarm
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	destroy: function(req, res, next) {
		AlarmService.destroyAlarm(req.param('id'), function(err,alarm){
			if(err) return res.json(err);
			
			res.json(alarm)
		});
	}
};