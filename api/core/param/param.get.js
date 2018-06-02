var queries = require('./param.queries.js');

/**
 * @public
 * @description This function return all params
 * @name gladys.param.get
 * @returns {Array<params>} param
 * @example
 * gladys.param.get()
 *      .then(function(params){
 *          // do something
 *      })
 */

module.exports = function(){
  return gladys.utils.sql(queries.get, []);  
};