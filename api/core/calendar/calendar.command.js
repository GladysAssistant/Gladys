const moment = require('moment');

module.exports = function command(scope) {

    switch(scope.label) {
        case 'get-next-event': 
            return gladys.calendar.getNextEventUser(scope.user)
                .then((event) => {
                    
                    var start = moment(event.start).locale(scope.user.language);
                    var end = moment(event.end).locale(scope.user.language);
                    
                    return {
                        label: 'tell-next-event-calendar',
                        scope: {
                            '%NEXT_EVENT_TITLE%': event.name,
                            '%NEXT_EVENT_START_DATE%': start.format('LL'),
                            '%NEXT_EVENT_START_TIME%': start.format('LT'),
                            '%NEXT_EVENT_START_DATETIME%': start.format('LLL'),
                            '%NEXT_EVENT_START_IN%': start.fromNow(),
                            '%NEXT_EVENT_END_DATE%': end.format('LL'),
                            '%NEXT_EVENT_END_TIME%': end.format('LT'),
                            '%NEXT_EVENT_END_DATETIME%': end.format('LLL'),
                            '%NEXT_EVENT_END_IN%': end.fromNow(),
                        }
                    };
                })
                .catch(() => {
                    return {
                        label: 'no-coming-event-calendar'
                    };
                });
        break;

        default: 
            return Promise.reject(new Error('Command not found'));
        break; 
    }
};