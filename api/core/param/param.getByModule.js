var queries = require('./param.queries.js');

/**
 * @public
 * @description This function return all params by module
 * @name gladys.param.getByModule
 * @returns {Array<params>} param
 * @example
 * gladys.param.getByModule({id: MODULE_ID})
 *      .then((params) => {
 *          // do something
 *      })
 */

module.exports = function(options){
  return gladys.utils.sql(queries.getByModule, [options.id]);  
};