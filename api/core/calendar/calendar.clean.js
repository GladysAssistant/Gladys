var queries = require('./calendar.queries.js');

module.exports = function(calendar) {
    
    return gladys.utils.sql(queries.deleteEventFromCalendar, [calendar.id]);
};