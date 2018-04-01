var queries = require('./paramUser.queries.js');

/**
 * @public
 * @description This function return all param of an user
 * @name gladys.paramUser.get
 * @param {Object} user
 * @param {integer} user.id The id of the user we want get param
 * @returns {Array<ParamUser>} paramUser
 * @example
 * var user = {
 *      id: 1
 * }
 * 
 * gladys.paramUser.get(user)
 *      .then(function(paramsUser){
 *          // do something
 *      })
 */

module.exports = function(user){
    return gladys.utils.sql(queries.get, [user.id]);  
};