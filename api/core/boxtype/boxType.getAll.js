var queries = require('./boxType.queries.js');

/**
 * @public
 * @description This function return all boxType
 * @name gladys.boxType.getAll
 * @returns {Array<boxTypes>} boxType
 * @example
 * gladys.boxType.getAll()
 *      .then(function(boxTypes){
 *         // boxType deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function getAll(){
    return gladys.utils.sql(queries.getAll, []);
};