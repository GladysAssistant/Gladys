var queries = require('./calendar.queries.js');

module.exports = function createEvent(event) {
    
    return gladys.utils.sql(queries.getCalendarEventByExternalId, [event.externalid])
        .then((result) => {
            if(result.length) return CalendarEvent.update({externalid: event.externalid}, event);
            
            return CalendarEvent.create(event);
        });
};
