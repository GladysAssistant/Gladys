var Promise = require('bluebird');

/**
 * @public
 * @description This function update an calendar
 * @name gladys.calendar.update
 * @param {Object} calendar
 * @param {integer} calendar.id The id of calendar
 * @param {String} calendar.externalid The externalId of the calendar
 * @param {String} calendar.name The name of the calendar
 * @param {String} calendar.description The description of the calendar
 * @param {String} calendar.service The service of the calendar
 * @param {User} calendar.user The id of the calendar's user
 * @returns {calendar} calendar
 * @example
 * var calendar = {
 *      id: 1,
 *      externalid: "gladys-calendar123456789", //This is an example, do not use it, it must be unique
 *      name: "My awesome calendar",
 *      description: "calendar description",
 *      service: "google"
 *      user: 1
 * };
 *
 * gladys.calendar.update(calendar)
 *      .then(function(calendar){
 *         // calendar updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(calendar){
    var id = calendar.id;
    delete calendar.id;
    
    // we update the calendar
    return Calendar.update({id}, calendar)
        .then(function(calendars){
            
            if(calendars.length === 0){
                return Promise.reject(new Error('Calendar not found'));
            } else {
                return Promise.resolve(calendars[0]);
            }
        });
};