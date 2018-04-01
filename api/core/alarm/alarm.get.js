var queries = require('./alarm.queries.js');

/**
 * @public
 * @description This function retunr all alarm of user
 * @name gladys.alarm.get
 * @param {Object} user
 * @param {integer} user.id The id of the user whose alarms we want
 * @returns {Array<alarms>} alarm
 * @example
 * var user = {
 *      id: 1,
 * };
 * 
 * gladys.alarm.get(user)
 *      .then(function(alarms){
 *         // all alarms of this user ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(user){
    return gladys.utils.sql(queries.get, [user.id]);
};