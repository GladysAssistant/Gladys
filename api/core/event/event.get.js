var queries = require('./event.queries.js');

/**
 * @public
 * @description This function return all events
 * @name gladys.event.get
 * @param {Object} options
 * @param {integer} options.take The number of events to return (optional)
 * @param {integer} options.skip The number of events to skip (optional)
 * @returns {Array<events>} events
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0
 * }
 * gladys.event.get(options)
 *      .then(function(devices){
 *          // do something
 *      })
 */

module.exports = function(options){
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    return gladys.utils.sql(queries.getByUser, [options.user.id, options.take, options.skip]);
};