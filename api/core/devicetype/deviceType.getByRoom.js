var queries = require('./deviceType.queries.js');
var Promise = require('bluebird');

/**
 * @public
 * @description This function return all deviceTypes ordered by room
 * @name gladys.deviceType.getByRoom
 * @returns {Array<deviceType>} deviceType
 * @example
 * gladys.deviceType.getByRoom()
 *      .then(function(deviceTypes){
 *          // do something
 *      })
 */

module.exports = function(){

    var rooms = [];
    var roomDictionnary = {};
    
    // get all rooms
    return gladys.utils.sql(queries.getByRooms, [])
        .then((deviceTypes) => {
            deviceTypes.forEach(deviceType => {
                
                if(!roomDictionnary.hasOwnProperty(deviceType.roomId)) {
                    roomDictionnary[deviceType.roomId] = rooms.length;
                    rooms.push({
                        id: deviceType.roomId,
                        name: deviceType.roomName,
                        house: deviceType.roomHouse,
                        deviceTypes: []
                    });
                }

                var roomId = deviceType.roomId;
                delete deviceType.roomId;
                delete deviceType.roomName;
                
                rooms[roomDictionnary[roomId]].deviceTypes.push(deviceType);
            });
            return rooms;
        });
};


function getDeviceTypesInRoom(room){
    
    // get all deviceTypes in room
    return gladys.utils.sql(queries.getByRoom, [room.id])
      .then(function(deviceTypes){
         
         // if there is some deviceTypes in this room
         if(deviceTypes.length){
             
             // return room with deviceTypes
             room.deviceTypes = deviceTypes;
             return room; 
         } else {
             return null;
         }
         
      });
}