var queries = require('./house.queries.js');

/**
 * @public
 * @description This function retunr an house
 * @name gladys.house.getById
 * @param {Object} house
 * @param {integer} house.id The id of the house
 * @returns {House} house
 * @example
 * var house = {
 *      id: 1
 * }
 * 
 * gladys.house.getById(house)
 *      .then(function(house){
 *          // do something
 *      })
 */

module.exports = function getById(options){
    
    return gladys.utils.sqlUnique(queries.getById, [options.id]);
};