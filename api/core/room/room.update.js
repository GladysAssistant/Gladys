var Promise = require('bluebird');

/**
 * @public
 * @description This function update an room
 * @name gladys.room.update
 * @param {Object} room
 * @param {integer} room.id The id of the room
 * @param {String} room.name The name of the room
 * @param {House} room.house The id of the house of the room
 * @returns {Room} room
 * @example
 * var room = {
 *      id: 1,
 *      name: "living room updated",
 *      house: 1,
 * }
 * 
 * gladys.room.update(room)
 *      .then(function(room){
 *          // room updated
 *      })
 */

module.exports = function update(room){
    var id = room.id;
    delete room.id;
    return Room.update({id}, room)
      .then(function(rooms){
          if(rooms.length === 0){
              return Promise.reject(new Error('NotFound'));
          } else {
              return Promise.resolve(rooms[0]);
          }
      });
};