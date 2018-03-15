var queries = require('./calendar.queries.js');
const Promise = require('bluebird');

/**
 * @public
 * @description This function create an calendar
 * @name gladys.calendar.create
 * @param {Object} calendars
 * @param {String} calendars.externalid The externalId of the calendar
 * @param {String} calendars.name The name of the calendar
 * @param {String} calendars.description The description of the calendar
 * @param {String} calendars.service The service of the calendar
 * @param {User} calendars.user The id of the calendar's user
 * @returns {calendar} calendar
 * @example
 * var calendars = {
 *      externalid: "gladys-calendar123456789", //This is an example, do not use it, it must be unique
 *      name: "My awesome calendar",
 *      description: "calendar description",
 *      service: "google"
 *      user: 1
 * };
 *
 * gladys.calendar.create(calendars)
 *      .then(function(calendar){
 *         // calendar created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create(calendars) {
    
    if(!(calendars instanceof Array)) calendars = [calendars];

    return Promise.map(calendars, function(calendar) {
        return insertCalendarIfNotExist(calendar);
    });
};

function insertCalendarIfNotExist(calendar){

    // test if calendar already exist
    return gladys.utils.sql(queries.getCalendarByExternalId, [calendar.externalid])
        .then((result) => {
            if(result.length) return Calendar.update({externalid: calendar.externalid}, calendar);

            return Calendar.create(calendar);
        });
}