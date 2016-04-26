module.exports = create;

var queries = require('./device.queries.js');

/**
 * Create a Device and its DeviceType 
 * only if a device with the same identifier does not exist
 */
function create(param) {
    return gladys.utils.sql(queries.getByIdentifier, [param.device.identifier])
      .then(function(devices){
         
          if(devices.length){
              
               // if device already exist, we don't create it again
              return param;
          } else {
              
              // if not, we create the device
              return gladys.device.create(param);
          }
      });   
}