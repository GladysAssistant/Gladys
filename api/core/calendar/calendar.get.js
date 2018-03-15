var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function return all calendars
 * @name gladys.calendar.get
 * @param {Object} options
 * @param {integer} options.take The number of calendars to return (optional)
 * @param {integer} options.skip The number of calendars to skip (optional)
 * @returns {Array<calendars>} calendars
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0
 * }
 * gladys.calendar.get(options)
 *      .then(function(calendars){
 *          // do something
 *      })
 */

module.exports = function(options) {
    
    options = options || {};
    options.take = options.take || 50;
    options.skip = options.skip || 0;
    
    return gladys.utils.sql(queries.getCalendars, [options.user.id, options.take, options.skip]);
};
