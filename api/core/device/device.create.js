module.exports = create;

var queries = require('./device.queries.js');
var Promise = require('bluebird');

/**
 * Create a Device and its DeviceType.
 */
function create(param) {

    // we test first if the device and it's identifier already exist or not
    return gladys.utils.sql(queries.getByIdentifier, [param.device.identifier, param.device.service])
      .then(function(devices){
         
          if(devices.length){
              
               // if device already exist, we update it
              return Device.update({id: devices[0].id}, param.device)
                           .then((rows) => rows[0]);
          } else {
              
              // if not, we create the device
              return Device.create(param.device);
          }
      })
      .then((device) => {

          // foreach deviceType, we create it if not exist
          return Promise.map(param.types, function(type){
               type.device = device.id;
               return gladys.deviceType.create(type);
          })
          .then((types) => {

              // we return device and types
              return {device: device, types: types};
          });

      })
      .then((result) => {

         // broadcast news to everyone
         gladys.socket.emit('newDevice', result);

         return result;
      });
}
