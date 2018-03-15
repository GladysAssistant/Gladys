
/**
 * @public
 * @description This function update an event
 * @name gladys.calendar.updateEvent
 * @param {Object} event
 * @param {integer} event.id The id of the event
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
 * gladys.calendar.updateEvent()
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