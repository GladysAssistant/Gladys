var queries = require('./area.queries.js');

/**
 * @public
 * @description This function return all area of the user
 * @name gladys.area.get
 * @param {Object} user
 * @param {integer} user.id The id of the user's areas
 * @returns {Array<areas>} area
 * @example
 * var user = {
 *      id: 1
 * };
 *
 * gladys.area.get(user)
 *      .then(function(areas){
 *         // all areas of this user ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(user){
   return gladys.utils.sql(queries.get, [user.id]);  
};