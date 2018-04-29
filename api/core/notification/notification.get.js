var queries = require('./notification.queries.js');

/**
 * @public
 * @description This function return all notifications
 * @name gladys.notification.get
 * @param {Object} options
 * @param {integer} options.take The number of notifications to return (optional)
 * @param {integer} options.skip The number of notifications to skip (optional)
 * @param {Object} options.user 
 * @param {Object} user
 * @param {integer} user.id The id of the user
 * @returns {Array<notifications>} notifications
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0,
 *      user: {
 *          id: 1
 *      }
 * }
 * gladys.notification.get(options)
 *      .then(function(notifications){
 *          // do something
 *      })
 */

module.exports = function (options){
    
    options = options || {};
    options.take = parseInt(options.take) || 50;
    options.skip = parseInt(options.skip) || 0;
    
    return gladys.utils.sql(queries.get, [options.user.id, options.take, options.skip]);
};