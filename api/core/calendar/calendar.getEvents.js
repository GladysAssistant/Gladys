var queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function return all events
 * @name gladys.calendar.getEvents
 * @param {Object} options
 * @param {integer} options.take The number of events to return (optional)
 * @param {integer} options.skip The number of events to skip (optional)
 * @returns {Array<events>} events
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0
 * }
 * gladys.calendar.getEvents(options)
 *      .then(function(events){
 *          // do something
 *      })
 */

module.exports = function(options) {
    
    options = options || {};
    options.take = options.take || 50;
    options.skip = options.skip || 0;
    
    return gladys.utils.sql(queries.getNextEvents, [options.user.id, options.take, options.skip]);
};
