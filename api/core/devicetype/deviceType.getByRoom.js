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

module.exports = function(options){

    options = options || {};

    var rooms = [];
    var roomDictionnary = {};
    
    // get all deviceTypes, filter or not by room
    return gladys.utils.sql(queries.getByRooms, [options.room, options.room])
        .then((deviceTypes) => {

            // reorganize rooms in tree
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