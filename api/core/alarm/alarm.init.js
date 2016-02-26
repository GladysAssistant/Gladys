var queries = require('./alarm.queries.js');
var Promise = require('bluebird');
var getAlarmsPromise = Promise.promisify(Alarm.query);

module.exports = function() {

  // get all alarms in database
  return getAlarmsPromise(queries.getAlarms, [])
              .then(function(alarms){
                  
                   // foreach alarm, we program it via gladys.scheduler
                   return Promise.map(alarms, function(alarm){
                       return gladys.alarm.schedule(alarm);
                   });
              });
};