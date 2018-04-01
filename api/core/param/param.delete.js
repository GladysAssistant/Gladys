var queries = require('./param.queries.js');
var shared = require('./param.shared.js');

/**
 * @public
 * @description This function delete an param
 * @name gladys.param.delete
 * @param {Object} param
 * @param {String} param.name The name of the param
 * @returns {Param} param
 * @example
 * var param = {
 *      name: "api_key"
 * }
 * 
 * gladys.param.delete(param)
 *      .then(function(param){
 *          // param deleted
 *      })
 */

module.exports = function(param){
    
    // delete cache entry
    if(shared.cache.hasOwnProperty(param.name)){
        delete shared.cache[param.name];
    }
    
    // delete in db
    return gladys.utils.sql(queries.delete, [param.name]);
};