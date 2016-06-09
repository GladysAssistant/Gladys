var queries = require('./calendar.queries.js');
var Promise = require('bluebird');

// resolve if the user has the right to see the calendarEvent, otherwise reject
module.exports = function authorization(params){
  return gladys.utils.sql(queries.authorizationCalendarEvent, [params.calendarEvent.id, params.user.id])
        .then(function(calendarEvents){
           if(calendarEvents.length === 0){
               return Promise.reject(new Error('Unauthorized'));
           } else {
               return Promise.resolve(calendarEvents[0]);
           }
        });
};