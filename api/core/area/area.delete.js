var queries = require('./area.queries.js');

/**
 * @public
 * @description This function delete an area
 * @name gladys.area.delete
 * @param {Object} area
 * @param {integer} area.id The id of the area
 * @returns {area} area
 * @example
 * var area = {
 *      id: 1
 * };
 *
 * gladys.area.delete(area)
 *      .then(function(area){
 *         // area deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */


module.exports = function(area){
    return gladys.utils.sql(queries.delete, [area.id]);
};