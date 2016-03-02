var Promise = require('bluebird');
var shared = require('./alarm.shared.js');

module.exports = function cancel(alarm) {
    if (shared.tabAlarmScheduled.hasOwnProperty(alarm.id)) {
        sails.log.info(`Cancelling alarm ID n° ${alarm.id}`);

        return gladys.scheduler.delete({
                index: shared.tabAlarmScheduled[alarm.id]
            })
            .then(function() {
                return Promise.resolve(alarm);
            });
    }
    return Promise.resolve(alarm);
};
