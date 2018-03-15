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
    
    // get all rooms
    return gladys.room.getAll()
      .then(function(rooms){
          var arrayToReturn = [];
          return Promise.map(rooms, function(room){
              return getDeviceTypesInRoom(room)
                .then(function(result){
                    
                    // we add the room only if the room 
                    // has deviceTypes
                    if(result){
                        arrayToReturn.push(result);
                    }
                });
          })
          .then(function(){
             return arrayToReturn; 
          });
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