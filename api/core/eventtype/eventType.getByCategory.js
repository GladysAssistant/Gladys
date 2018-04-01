var queries = require('./eventType.queries.js');

/**
 * @public
 * @description This function return all eventType of one category
 * @name gladys.eventType.getByCategory
 * @param {Object} options
 * @param {String} options.category The category of eventType to return
 * @returns {Array<eventType>} eventTypes
 * @example
 * var type = {
 *      category: "user"
 * }
 * gladys.eventType.getByCategory(options)
 *      .then(function(eventTypes){
 *          // do something
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(options){
  return gladys.utils.sql(queries.getByCategory, [options.category]);  
};