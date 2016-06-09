// update an alarm
module.exports = function(params) {
    return Alarm.update({
            id: params.id
        }, params.alarm)
        .then(function(alarms) {

            if (alarms.length === 0) {
                return Promise.reject(new Error('Alarm not found'));
            }

            if (!alarms[0].active) {
                return gladys.alarm.cancel(alarms[0]);
            } else {
                return Promise.resolve(alarms[0]);
            }
        });
};
