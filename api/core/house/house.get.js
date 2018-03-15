var queries = require('./house.queries.js');

/**
 * @public
 * @description This function return all houses
 * @name gladys.house.get
 * @param {Object} options
 * @param {integer} options.take The number of houses to return (optional)
 * @param {integer} options.skip The number of houses to skip (optional)
 * @returns {Array<houses>} houses
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0
 * }
 * gladys.house.get(options)
 *      .then(function(houses){
 *          // do something
 *      })
 */

module.exports = function get (options){
    
    options = options || {};
    options.take = parseInt(options.take) || 50;
    options.skip = parseInt(options.skip) || 0;
    
    return gladys.utils.sql(queries.get, [options.take, options.skip]);
};