var queries = require('./room.queries.js');

/**
 * @public
 * @description This function return all rooms
 * @name gladys.room.get
 * @param {Object} options
 * @param {integer} options.take The number of rooms to return (optional)
 * @param {integer} options.skip The number of rooms to skip (optional)
 * @returns {Array<rooms>} rooms
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0
 * }
 * gladys.room.get(options)
 *      .then(function(rooms){
 *          // do something
 *      })
 */

module.exports = function(options){
    
  options = options || {};
  options.skip = parseInt(options.skip) || 0;
  options.take = parseInt(options.take) || 50;
  
  return gladys.utils.sql(queries.get, [options.take, options.skip]);  
};