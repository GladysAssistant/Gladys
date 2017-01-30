var shared = require('./alarm.shared.js');

module.exports = function schedule(alarm) {
    var rule;

    // if alarm is a cronrule
    if(alarm.cronrule) {
        rule = alarm.cronrule;
    } // if the alarm is reccuring  
    else if (alarm.dayofweek === -1) {
        rule = new Date(alarm.datetime);
    } else {
        rule = {
            hour: parseInt(alarm.time.slice(0, 2)),
            minute: parseInt(alarm.time.slice(3)),
            dayOfWeek: alarm.dayofweek
        };
    }

    var options = {
        rule: rule,
        event: {
            code: 'alarm',
            value: alarm.id,
            scope: {
                alarm: alarm.id
            }
        }
    };

    return gladys.scheduler.create(options)
        .then(function(index) {
            shared.tabAlarmScheduled[alarm.id] = index;
            
            sails.log.info(`Scheduled alarm ${alarm.name}, with id ${alarm.id}`);
            return Promise.resolve(alarm);
        });
};
