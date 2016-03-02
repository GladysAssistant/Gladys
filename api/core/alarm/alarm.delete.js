var queries = require('./alarm.queries.js');

module.exports = function(alarm) {

    if (!alarm.id) {
        return Promise.reject(new Error('You should provide an id to delete an alarm'));
    }

    // deleting alarm from database
    return gladys.utils.sql(queries.deleteAlarm, [alarm.id])
        .then(function(alarm) {

            // cancelling alarm
            return gladys.alarm.cancel(alarm);
        });
};
