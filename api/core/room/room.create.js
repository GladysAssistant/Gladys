
/**
 * @public
 * @description This function create an room
 * @name gladys.room.create
 * @param {Object} room
 * @param {String} room.name The name of the room
 * @param {House} room.house The id of the house of the room
 * @returns {Room} room
 * @example
 * var room = {
 *      name: "living room",
 *      house: 1,
 * }
 * 
 * gladys.room.create(room)
 *      .then(function(room){
 *          // room created
 *      })
 */

module.exports = function(room){
    return Room.create(room);
};