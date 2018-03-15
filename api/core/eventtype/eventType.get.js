var queries = require('./eventType.queries.js');

/**
 * @public
 * @description This function return all eventTypes
 * @name gladys.eventType.get
 * @returns {Array<eventType>} eventType
 * @example
 * gladys.eventType.get()
 *      .then(function(eventTypes){
 *          // do something
 *      })
 */

module.exports = function(){
  return gladys.utils.sql(queries.get, []);  
};