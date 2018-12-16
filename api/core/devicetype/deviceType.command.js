var Promise = require('bluebird');
 
module.exports = function command(options){
  
  var value;
  var percentage;
  var deviceTypes = [];
 
  if(options.deviceTypes && options.deviceTypes.length){
    options.deviceTypes.forEach(function(deviceType) {
      if(!options.rooms || !options.rooms.length) {
        deviceTypes.push(deviceType);
      } else {
        options.rooms.forEach(function(room) {
          if(room.name === deviceType.roomName) {
            deviceTypes.push(deviceType);
          }
        });
      }
    });
    return Promise.map(deviceTypes, function(deviceType){
      switch(options.label){
      case 'set-device-on':
        value = deviceType.max;
        break;
      case 'set-device-off': 
        value = deviceType.min;
        break;
      case 'set-device-percentage':
        percentage = options.percentage;
        break;
      }
      return gladys.deviceType.exec({devicetype: deviceType.id, value: value, percentage: percentage});
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
            switch(options.label){
            case 'set-device-on':
              value = deviceType.max;
              break;
            case 'set-device-off': 
              value = deviceType.min;
              break;
            case 'set-device-percentage':
              percentage = option.percentage;
              break;
            }
            return gladys.deviceType.exec({devicetype: deviceType.id, value: value});
          });
        });
    });
  }
};
