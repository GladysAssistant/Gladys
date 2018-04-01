var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function delete an calendar
 * @name gladys.calendar.delete
 * @param {Object} calendar
 * @param {integer} calendar.id The id of calendar
 * @returns {calendar} calendar
 * @example
 * var calendar = {
 *      id: 1,
 * };
 *
 * gladys.calendar.delete(calendar)
 *      .then(function(calendar){
 *         // calendar deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(calendar) {
    
    // first we delete the events of the calendar
    return gladys.utils.sql(queries.deleteEventFromCalendar, [calendar.id])
        .then(function(){
            
            // then we delete the calendar
            return gladys.utils.sql(queries.deleteCalendar, [calendar.id]);
        });
};
