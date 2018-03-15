var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function delete an event
 * @name gladys.calendar.deleteEvent
 * @param {Object} calendarEvent
 * @param {integer} calendarEvent.id The id of the event
 * @returns {event} event
 * @example
 * var calendarEvent = {
 *      id: 1
 * };
 *
 * gladys.calendar.deleteEvent(calendarEvent)
 *      .then(function(event){
 *         //event deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(calendarEvent) {
    return gladys.utils.sql(queries.deleteEvent, [calendarEvent.id]);
};
