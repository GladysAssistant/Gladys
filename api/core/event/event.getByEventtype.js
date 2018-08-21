var queries = require('./event.queries.js');

/**
 * @public
 * @description This function return all events of one eventtype
 * @name gladys.event.getByEventtype
 * @param {Object} options
 * @param {integer} options.take The number of events to return (optional)
 * @param {integer} options.skip The number of events to skip (optional)
 * @param {Object} options.eventtype The id of eventtype
 * @returns {Array<events>} events
 * @example
 * var options = {
 *      eventtype: 1,
 *      take: 50,
 *      skip: 0
 * }
 * gladys.event.getByEventType(options)
 *      .then(function(events){
 *          // do something
 *      })
 */

module.exports = function(options){
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    return gladys.utils.sql(queries.getByEventType, [options.eventtype, options.take, options.skip]);
}