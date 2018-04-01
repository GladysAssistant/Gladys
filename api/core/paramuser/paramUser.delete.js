var queries = require('./paramUser.queries.js');
var shared = require('./paramUser.shared.js');

/**
 * @public
 * @description This function delete an user param
 * @name gladys.paramUser.delete
 * @param {Object} paramUser
 * @param {String} paramUser.name The name of the param
 * @param {String} paramUser.user The id of the user to whom the param is assigned
 * @returns {ParamUser} paramUser
 * @example
 * var paramUser = {
 *      name: "api_key",
 *      user: 1
 * }
 * 
 * gladys.paramUser.delete(paramUser)
 *      .then(function(param){
 *          // user param deleted
 *      })
 */

module.exports = function(paramUser){
    
    // delete in database
    return gladys.utils.sql(queries.deleteValue, [paramUser.name, paramUser.user])
      .then(function(){
          
          // then delete in cache
          if(shared.cache[paramUser.user] && shared.cache[paramUser.user][paramUser.name]){
              delete shared.cache[paramUser.user][paramUser.name];
          }
      });  
};