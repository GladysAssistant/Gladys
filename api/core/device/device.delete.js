var queries = require('./device.queries.js');

module.exports = function (device){
  
  // we delete all the devicetypes associated to the device
  return gladys.utils.sql(queries.deleteDeviceTypes, [device.id])
    .then(function(){
        
        // then we delete the device itself
        return gladys.utils.sqlUnique(queries.delete, [device.id]);
    });    
};