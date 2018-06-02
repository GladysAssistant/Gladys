const queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function returns the next event of the specified user's day
 * @name gladys.calendar.getNextEventUser
 * @param {Object} user
 * @param {integer} user.id The id of user
 * @returns {event} event
 * @example
 * var user = {
 *      id: 1
 * }
 * 
 * gladys.calendar.getNextEventUser(user)
 *      .then(function(event){
 *          // do something
 *      })
 */

module.exports = function getNextEventUser(user) {
    return gladys.utils.sqlUnique(queries.getNextEventUser, [user.id]);
};