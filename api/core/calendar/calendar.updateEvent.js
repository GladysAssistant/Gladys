
/**
 * @public
 * @description This function update an event
 * @name gladys.calendar.updateEvent
 * @param {Object} calendarEvent
 * @param {integer} calendarEvent.id The id of the event
 * @param {String} calendarEvent.externalid The externalId of the event
 * @param {String} calendarEvent.name The name of the event
 * @param {String} calendarEvent.location The location of the event
 * @param {datetime} calendarEvent.start The start of the event
 * @param {datetime} calendarEvent.end The end of the event
 * @param {boolean} calendarEvent.fullday If the event lasts a full day
 * @param {calendar} calendarEvent.calendar The id of the calendar
 * @returns {event} event
 * @example
 * var calendarEvent = {
 *      id: 1,
 *      externalid: "gladys-calendarevent123456789", //This is an example, do not use it, it must be unique
 *      name: "My new awesom event name",
 *      location: "Paris",
 *      start: "2018-03-20 08:30:00",
 *      end: "2018-03-20 09:30:00",
 *      fullday: false,
 *      calendar: 1
 * };
 *
 * gladys.calendar.updateEvent(calendarEvent)
 *      .then(function(event){
 *         // event updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */


module.exports = function(calendarEvent){
    var id = calendarEvent.id;
    delete calendarEvent.id;
    return CalendarEvent.update({id}, calendarEvent)
        .then(function(calendarEvents){
            
            if(calendarEvents.length === 0){
                return Promise.reject(new Error('CalendarEvent not found'));
            } else {
                return Promise.resolve(calendarEvents[0]);
            }
        });
};