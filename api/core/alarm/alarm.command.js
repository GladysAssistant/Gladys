const Promise = require('bluebird');
const moment = require('moment');

module.exports = function command(scope) {

    var toCall;
    var response = {};

    switch(scope.label) {
        case 'create-alarm':

            toCall = Promise.map(scope.times, function(time){
                if(time && time.start && time.start.date()) {
                    return gladys.alarm.create({name: 'Alarm', datetime: time.start.date(), user: scope.user.id, isWakeUp: true});
                }
            })
            .then((alarms) => {
                response.label = 'alarm-created';
                response.scope = {
                    '%ALARM_TIMES%': ''
                };

                // add row separated datetime
                alarms.forEach(function(alarm, index) {
                    if(alarm && alarm.datetime) {
                        if(response.scope['%ALARM_TIMES%'].length > 0) {
                            response.scope['%ALARM_TIMES%'] += ', ';
                        }
                        var alarmDate = moment(alarm.datetime).locale(scope.language);
                        response.scope['%ALARM_TIMES%'] += alarmDate.format('LLL');
                    }
                });

                return response;
            });
        break;
        
        default:
            toCall = Promise.reject(`ALARM_LABEL_DOES_NOT_EXIST`);
        break;
    }

    return toCall;
};