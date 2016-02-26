var shared = require('./alarm.shared.js');

module.exports = function create (alarm) {

    if(!alarm || (!alarm.dayofweek && !alarm.datetime) || (alarm.dayofweek && !alarm.time)){
        return Promise.reject(new Error('Wrong parameters, missing arguments.'));
    }
    
    // create alarm in db
    return Alarm.create(alarm)
         .then(function(alarm){
             
             // schedule the alarm with gladys.schedule
            return schedule(alarm);      
         });
};


function schedule(alarm){
    var rule;
        
    if(alarm.dayofweek === -1){
        rule = new Date(alarm.datetime);
    }else{
        rule = {
            hour: parseInt(alarm.time.slice(0,2)), 
            minute: parseInt(alarm.time.slice(3)), 
            dayOfWeek: alarm.dayofweek
        };
    }
    
    var options = {
      rule: rule,
      eventName: 'alarmRing',
      value: alarm.id  
    };
    
    return gladys.scheduler.create(options)
                 .then(function(index){
                     shared.tabAlarmScheduled[alarm.id] = index;
                     return Promise.resolve(alarm); 
                 });
}