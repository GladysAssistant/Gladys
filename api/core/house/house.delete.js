var queries = require('./house.queries.js');

/**
 * @public
 * @description This function delete an house
 * @name gladys.house.delete
 * @param {Object} house
 * @param {integer} house.id The id of the house
 * @example
 * var house = {
 *      id: 1
 * }
 * 
 * gladys.house.delete(house)
 *      .then(function(house){
 *          // do something
 *      })
 */

module.exports = function(house){
    return gladys.utils.sqlUnique(queries.delete, [house.id]);
};