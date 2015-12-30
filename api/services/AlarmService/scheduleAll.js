

var queries = require('./queries.js');

module.exports = function() {
		
		Alarm.query(queries.getAlarms , function(err, Alarms ){
			
			for(var i =0; i<Alarms.length;i++)
			{
				scheduleNewAlarm(Alarms[i]);
			}
			
			callback();
		});
};