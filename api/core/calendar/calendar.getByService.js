var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function return an calendar with a specific service
 * @name gladys.calendar.getByService
 * @param {String} service
 * @returns {calendar} calendar
 * @example
 * var service = "gladys-calendar123456789"
 * 
 * gladys.calendar.getByService(service)
 *      .then(function(calendar){
 *          // do something
 *      })
 */

module.exports = function getByService(service) {
    return gladys.utils.sql(queries.getByService, [service]);
};