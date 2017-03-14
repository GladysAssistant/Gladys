var Promise = require('bluebird');
var shared = require('./alarm.shared.js');

module.exports = function cancel(alarm) {
    
    if(!alarm.id){
        return Promise.reject(new Error('ALARM_NOT_FOUND'));
    }
    
    if (shared.tabAlarmScheduled.hasOwnProperty(alarm.id)) {
        sails.log.info(`Cancelling alarm ID n° ${alarm.id}`);

        return gladys.scheduler.delete({
                index: shared.tabAlarmScheduled[alarm.id]
            })
            .then(function() {
                return Promise.resolve(alarm);
            });
    } else {
        sails.log.info(`Could not cancel alarm ID ${alarm.id} : alarm was not scheduled`);
    }
    return Promise.resolve(alarm);
};
