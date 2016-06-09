var queries = require('./calendar.queries.js');

module.exports = function(calendar) {
    
    // first we delete the events of the calendar
    return gladys.utils.sql(queries.deleteEventFromCalendar, [calendar.id])
        .then(function(){
            
            // then we delete the calendar
            return gladys.utils.sql(queries.deleteCalendar, [calendar.id]);
        });
};
