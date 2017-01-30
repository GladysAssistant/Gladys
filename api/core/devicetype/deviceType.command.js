var Promise = require('bluebird');

module.exports = function command(options){
  console.log(options); 
  
  var value;
  
  switch(options.label){
      case 'set-device-on':
        value = 1;
      break;
      case 'set-device-off': 
        value = 0;
      break;
  }
  
   if(options.deviceTypes && options.deviceTypes.length){
        return Promise.map(options.deviceTypes, function(deviceType){
            return gladys.deviceType.exec({devicetype: deviceType.id, value: value});
        });
   } else if(options.rooms && options.rooms.length) {
        
        // foreach room found
        return Promise.map(options.rooms, function(room) {

            // get all binary lights deviceType in the room
            return gladys.deviceType.getByCategory({category: 'light', type: 'binary', room: room.id})
              .then((deviceTypes) => {

                 sails.log.info(`DeviceType.command : Found ${deviceTypes.length} deviceType in room ${room.name}`);
                  
                  // then, foreach deviceTypes found, turn it on/off
                  return Promise.map(deviceTypes, function(deviceType) {
                      return gladys.deviceType.exec({devicetype: deviceType.id, value: value});
                  });
              })
        });
   }
   
};