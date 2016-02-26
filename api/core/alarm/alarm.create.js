
module.exports = function create (alarm) {

    if(!alarm || (!alarm.dayofweek && !alarm.datetime) || (alarm.dayofweek && !alarm.time)){
        return Promise.reject(new Error('Wrong parameters, missing arguments.'));
    }
    
    // create alarm in db
    return Alarm.create(alarm)
         .then(function(alarm){
             
             // schedule the alarm with gladys.schedule
            return gladys.alarm.schedule(alarm);      
         });
};