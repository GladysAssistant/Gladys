
module.exports = function create (alarm) {

    if(!alarm || (!alarm.dayofweek && !alarm.datetime) || (alarm.dayofweek && !alarm.time)){
        return Promise.reject(new Error('Wrong parameters, missing arguments.'));
    }
    
    // create alarm in db
    return Alarm.create(alarm)
         .then(function(alarm){
            
            // if alarm is in the future, we schedule the alarm
            if(new Date(alarm.datetime) > new Date() || alarm.recurring !== -1){
				
                // schedule the alarm with gladys.schedule
                return gladys.alarm.schedule(alarm); 
			} else {
                return Promise.resolve(alarm);
            }
         });
};