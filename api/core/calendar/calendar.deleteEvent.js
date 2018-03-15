var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function delete an event
 * @name gladys.calendar.deleteEvent
 * @param {Object} event
 * @param {integer} event.id The id of the event
 * @returns {event} event
 * @example
 * var event = {
 *      id: 1
 * };
 *
 * gladys.calendar.deleteEvent()
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
