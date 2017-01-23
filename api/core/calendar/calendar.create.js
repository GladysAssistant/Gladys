var queries = require('./calendar.queries.js');
const Promise = require('bluebird');

module.exports = function create(calendars) {
    
    if(!calendars instanceof Array) calendars = [calendars];

    return Promise.map(calendars, function(calendar) {
        return insertCalendarIfNotExist(calendar);
    });
};

function insertCalendarIfNotExist(calendar){

    // test if calendar already exist
    return gladys.utils.sql(queries.getCalendarByExternalId, [calendar.externalid])
        .then((result) => {
            if(result.length) return Calendar.update({externalid: calendar.externalid}, calendar);

            return Calendar.create(calendar);
        });
}