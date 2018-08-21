var queries = require('./deviceState.queries.js');

/**
 * @public
 * @description This function purge table of deviceState
 * @name gladys.deviceState.purge
 * @param {Object} options
 * @param {number} options.devicetype The id of deviceType to purge the states
 * @param {number} options.days The number of days beyond which we want to purge the states
 * @example
 * var options = {
 *      devicetype: 1,
 *      days: 2
 * }
 * gladys.deviceState.purge(options)
 *      .then(function(deviceStates){
 *          // do something
 *      })
 */

module.exports = function purge(options){
    options.days = parseInt(options.days) || 60;
    
    return gladys.utils.sql(queries.purge, [options.devicetype, options.days]);
};
