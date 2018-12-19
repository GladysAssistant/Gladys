var queries = require('./area.queries.js');

/**
 * @public
 * @description This function return all area
 * @name gladys.area.getAll
 * @param {Object} user
 * @returns {Array<areas>} area
 * @example
 *
 * gladys.area.getAll()
 *      .then(function(areas){
 *         // all areas  
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(){
  return gladys.utils.sql(queries.getAll);  
};
