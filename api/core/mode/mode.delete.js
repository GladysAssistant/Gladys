var queries = require('./mode.queries.js');

/**
 * @public
 * @description This function delete an mode
 * @name gladys.mode.delete
 * @param {Object} mode
 * @param {integer} mode.id The id of the mode
 * @returns {Mode} mode
 * @example
 * var mode = {
 *      id: 1
 * }
 * 
 * gladys.mode.delete(mode)
 *      .then(function(mode){
 *          // mode deleted
 *      })
 */

module.exports = function(mode){
    return gladys.utils.sql(queries.delete, mode.id);
};