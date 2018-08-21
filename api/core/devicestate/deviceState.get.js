var queries = require('./deviceState.queries.js');

/**
 * @public
 * @description This function return all deviceState
 * @name gladys.deviceState.get
 * @param {Object} options
 * @param {integer} options.take The number of deviceStates to return (optional)
 * @param {integer} options.skip The number of deviceStates to skip (optional)
 * @returns {Array<deviceStates>} deviceStates
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0
 * }
 * gladys.deviceState.get(options)
 *      .then(function(deviceStates){
 *          // do something
 *      })
 */

module.exports = function get(options){
    options.take = parseInt(options.take) || 25;
    options.skip = parseInt(options.skip) || 0;

    if(options.devicetype) {
        return gladys.utils.sql(queries.getByDeviceType, [options.devicetype, options.take, options.skip]);
    }  else {
        return gladys.utils.sql(queries.get, [options.take, options.skip]);
    }
};