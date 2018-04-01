var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function create an event
 * @name gladys.calendar.createEvent
 * @param {Object} event
 * @param {String} event.externalid The externalId of the event
 * @param {String} event.name The name of the event
 * @param {String} event.location The location of the event
 * @param {datetime} event.start The start of the event
 * @param {datetime} event.end The end of the event
 * @param {boolean} event.fullday If the event lasts a full day
 * @param {Calendar} event.calendar The id of the calendar
 * @returns {event} event
 * @example
 * var event = {
 *      externalid: "gladys-calendarevent123456789", //This is an example, do not use it, it must be unique
 *      name: "My awesom event",
 *      location: "Paris",
 *      start: "2018-03-20 08:30:00",
 *      end: "2018-03-20 09:30:00",
 *      fullday: false,
 *      calendar: 1
 * };
 *
 * gladys.calendar.createEvent()
 *      .then(function(event){
 *         // event created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function createEvent(event) {
    
    return gladys.utils.sql(queries.getCalendarEventByExternalId, [event.externalid])
        .then((result) => {
            if(result.length) return CalendarEvent.update({externalid: event.externalid}, event);
            
            return CalendarEvent.create(event);
        });
};
