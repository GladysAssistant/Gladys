
// contains all the index of the scheduled job to cancel them in the future
var tabAlarmScheduled = [];

module.exports = function schedule (alarm) {

	if(alarm.recurring === -1){
		var rule = new Date(alarm.datetime);
	}else{
		var rule = {
            hour: alarm.time.slice(0,2), 
            minute: alarm.time.slice(3), 
            dayOfWeek: alarm.recurring
        };
	}
    
	var id = alarm.id;
	tabAlarmScheduled[id] = SchedulerService.scheduleEvent(rule, 'alarmRing',id);
};