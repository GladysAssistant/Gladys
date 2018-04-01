var queries = require('./box.queries.js');

/**
 * @public
 * @description This function delete an box
 * @name gladys.box.delete
 * @param {Object} box
 * @param {integer} box.id The id of the box
 * @returns {box} box
 * @example
 * var box = {
 *      id: 1
 * };
 *
 * gladys.box.delete(box)
 *      .then(function(box){
 *         // box deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(box){
    return gladys.utils.sql(queries.delete, [box.id]);
};