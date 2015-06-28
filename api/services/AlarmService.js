/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

var tabAlarmScheduler = [];


/**
 * to convert '1' in '01' (useful to get hour)
 * @method twoDigit
 * @param {} nb
 * @return nb
 */
function twoDigit(nb){
	if(nb<10)
		nb = '0'+ nb;
	return nb;
}


/**
 * return time (ex: '12:02')
 * @method getActualTime
 * @return BinaryExpression
 */
function getActualTime (){
	var date = new Date();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	hours = twoDigit(hours);
	minutes = twoDigit(minutes);
	return hours + ':' + minutes;
}

/**
 * return date in SQL format (ex: 2014-12-27)
 * @method getActualDate
 * @return BinaryExpression
 */
function getActualDate (){
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	month = twoDigit(month);
	day = twoDigit(day);
	return year + '-' + month + '-' + day;
};


/**
 * Schedule the ring of an alarm passed in parametres
 * @method scheduleNewAlarm
 * @param {} Alarm
 * @return 
 */
function scheduleNewAlarm (Alarm){
	var rule;
	if(Alarm.recurring == -1){
		rule = new Date(Alarm.datetime);
	}else{
		rule = {hour: Alarm.time.slice(0,2), minute: Alarm.time.slice(3), dayOfWeek: Alarm.recurring};
	}
	var id = Alarm.id;
	tabAlarmScheduler[id] = SchedulerService.scheduleEvent(rule, 'alarmRing',id);
}

module.exports = {

	/**
	 * Description
	 * @method create
	 * @param {} name
	 * @param {} datetime
	 * @param {} time
	 * @param {} recurring
	 * @param {} user
	 * @param {} callback
	 * @return 
	 */
	create: function(name,datetime,time,recurring, user,callback){
		
		callback = callback || function() {};
		
		var alarmObj = {
			name:name, 
			datetime: datetime,
			time:time,
			recurring:recurring,
			user:user
		};
		Alarm.create(alarmObj, function(err, alarm){
			if(err) return callback(err);
			
			if(new Date(datetime) > new Date() || recurring != -1){
				scheduleNewAlarm(alarm);
			}
			callback(null, alarm);
		});
	},
	
	/**
	 * Description
	 * @method destroyAlarm
	 * @param {} id
	 * @param {} callback
	 * @return 
	 */
	destroyAlarm: function(id,callback){
		
		callback = callback || function() {};
		
		Alarm.destroy({
			id: id,
		}, function alarmDestroyed(err, alarm) {
			if (err) return callback(err);
			
			if(tabAlarmScheduler[id]){
				tabAlarmScheduler[id].cancel();	
			}
			callback(null,alarm);
		});
	},

	/**
	 * Description
	 * @method scheduleAllAlarms
	 * @return 
	 */
	scheduleAllAlarms: function(callback){
		
		callback = callback || function() {};
		
		var request = "SELECT * FROM alarm ";
		request+= " WHERE (status = 1) ";
		request+= " AND ( (recurring = -1 AND datetime > SYSDATE() ) OR recurring <> -1 ) ";
		Alarm.query(request, function(err, Alarms ){
			if(err) return sails.log.warn('Alarme, scheduleAllAlarms(), error : ' + err);
			
			for(var i =0; i<Alarms.length;i++)
			{
				scheduleNewAlarm(Alarms[i]);
			}
			
			callback();
		});
	},
	
	/**
	 * EXPERIMENTAL, COMING SOON
	 */
	/*scheduleAutoAlarm: function(userId, callback){
		User.findOne({id:userId})
			.populate('parametres')
			.exec(function(err, user){
				if(err) return callback(err);

				if(!user) return callback('AlarmService : scheduleAutoAlarm : User does not exist');

				if(!user.parametres.autoWakeUp) return callback('AlarmService : scheduleAutoAlarm : User don\'t want to be autoWaked Up !');

				CalendarService.getNextEvent(userId, function(err, event){
					if(err) return callback(err);

					if(!event) return callback(null, null);


				});
		});
	}*/

};