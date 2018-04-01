var queries = require('./mode.queries.js');

/**
 * @public
 * @description This function return all modes
 * @name gladys.mode.get
 * @returns {Array<mode>} modes
 * @example
 * gladys.mode.get()
 *      .then(function(modes){
 *          // do something
 *      })
 */

module.exports = function(){
  return gladys.utils.sql(queries.get, []);
};