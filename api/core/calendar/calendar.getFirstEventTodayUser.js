const queries = require('./calendar.queries.js');

/**
 * @public
 * @description This function returns the first event of the specified user's day
 * @name gladys.calendar.getFirstEventTodayUser
 * @param {integer} userId
 * @returns {event} event
 * @example
 * var userId = 1
 * 
 * gladys.calendar.getFirstEventTodayUser(userId)
 *      .then(function(event){
 *          // do something
 *      })
 */

module.exports = function getFirstEventTodayUser(userId) {
    return gladys.utils.sqlUnique(queries.getFirstEventTodayUser, [userId]);
};