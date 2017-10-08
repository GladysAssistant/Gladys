module.exports = function create(alarm) {

    if (!(alarm && ( (alarm.dayofweek && alarm.time) || alarm.cronrule || alarm.datetime || alarm.autoWakeUp)) ){
        return Promise.reject(new Error('Wrong parameters, missing arguments.'));
    }

    // create alarm in db
    return Alarm.create(alarm)
        .then(function(alarm) {

            // if alarm is in the future, active and is not a autoWakeUp, or is a cronrule we schedule the alarm
            if (alarm.active && !alarm.autoWakeUp && (new Date(alarm.datetime) > new Date() || alarm.dayofweek !== -1 || alarm.cronrule)) {

                // schedule the alarm with gladys.schedule
                return gladys.alarm.schedule(alarm);
            } else {
                return Promise.resolve(alarm);
            }
        });
};
