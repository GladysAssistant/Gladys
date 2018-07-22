var queries = require('./event.queries.js');

/**
 * @public
 * @description This function return all events
 * @name gladys.event.get
 * @param {Object} options
 * @param {integer} options.take The number of events to return (optional)
 * @param {integer} options.skip The number of events to skip (optional)
 * @param {Object} options.user
 * @param {Object} user
 * @param {integer} user.id Th id of user 
 * @returns {Array<events>} events
 * @example
 * var options = {
 *      user = {id: 1},
 *      take: 50,
 *      skip: 0
 * }
 * gladys.event.get(options)
 *      .then(function(events){
 *          // do something
 *      })
 */

module.exports = function(options){
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    return gladys.utils.sql(queries.getByUser, [options.user.id, options.take, options.skip]);
};