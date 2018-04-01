var queries = require('./room.queries.js');

/**
 * @public
 * @description This function delete an room
 * @name gladys.room.delete
 * @param {Object} room
 * @param {integer} room.id The id of the room
 * @returns {Room} room
 * @example
 * var room = {
 *      id: 1,
 * }
 * 
 * gladys.room.delete(room)
 *      .then(function(room){
 *          // room deleted
 *      })
 */

module.exports = function(room){
    return gladys.utils.sqlUnique(queries.delete, [room.id]);
};