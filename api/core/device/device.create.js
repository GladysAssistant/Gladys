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
              
               // if device already exist, we don't create it again
              return param;
          } else {
              
              // if not, we create the device
              return createDevice(param);
          }
      });   
}

function createDevice(param){
    
    // first, we create the device
    return Device.create(param.device)
        .then(function(device) {

            // we create all the types
            return Promise.map(param.types, function(type) {
                type.device = device.id;
                return DeviceType.create(type);
            })

            // we return the results
            .then(function(types) {
                var result = {
                    device: device,
                    types: types
                };
                return Promise.resolve(result);
            });
        });
}
