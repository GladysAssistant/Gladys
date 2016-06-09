var queries = require('./calendar.queries.js');
var Promise = require('bluebird');

// resolve if the user has the right to see the calendar, otherwise reject
module.exports = function authorization(params){
  return gladys.utils.sql(queries.authorizationCalendar, [params.calendar.id, params.user.id])
        .then(function(calendars){
           if(calendars.length === 0){
               return Promise.reject(new Error('Unauthorized'));
           } else {
               return Promise.resolve(calendars[0]);
           }
        });
};