const queries = require('./alarm.queries.js');
const Promise = require('bluebird');

module.exports = function checkAllAutoWakeUp(){

    // first, get all auto alarms for today
    return gladys.utils.sql(queries.getAutoWakeUpToday, [])
        .then((alarms) => {
            
            return Promise.map(alarms, function(alarm){
                return gladys.alarm.checkAutoWakeUp(alarm);
            });
        });
};