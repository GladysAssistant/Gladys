var queries = require('./boxType.queries.js');

/**
 * @public
 * @description This function delete an boxType
 * @name gladys.boxType.delete
 * @param {Object} boxType
 * @param {integer} boxType.id The id of the boxType
 * @returns {boxType} boxType
 * @example
 * var boxType = {
 *      id: 1
 * };
 *
 * gladys.boxType.delete(boxType)
 *      .then(function(boxType){
 *         // boxType deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function (boxType){
    return gladys.utils.sql(queries.delete, [boxType.id]);
};
