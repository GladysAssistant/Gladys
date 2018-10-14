var queries = require('./calendar.queries.js');
var Promise = require('bluebird');

// resolve if the user has the right to see the calendar, otherwise reject
module.exports = function authorization(calendarId, userId){
  return gladys.utils.sql(queries.authorizationCalendar, [calendarId, userId])
    .then(function(calendars){
      if(calendars.length === 0){
        return Promise.reject(new Error('Unauthorized'));
      } else {
        return Promise.resolve(calendars[0]);
      }
    });
};