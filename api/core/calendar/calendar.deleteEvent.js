var queries = require('./calendar.queries.js');

module.exports = function(calendarEvent) {
    return gladys.utils.sql(queries.deleteEvent, [calendarEvent.id]);
};
