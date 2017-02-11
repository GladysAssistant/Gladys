var queries = require('./alarm.queries.js');
var Promise = require('bluebird');

module.exports = function() {

    // get all alarms in database
    return gladys.utils.sql(queries.getAlarms, [])
        .then(function(alarms) {

            // foreach alarm, we program it via gladys.alarm.schedule
            return Promise.map(alarms, function(alarm) {
                return gladys.alarm.schedule(alarm);
            });
        });
};
