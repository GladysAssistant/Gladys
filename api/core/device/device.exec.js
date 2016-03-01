module.exports = set;

var Promise = require('bluebird');
var queries = require('./device.queries.js');

/**
 * Set a new state for a device by executing 
 * the related service.
 */
function set (param) {
    
    return gladys.utils.sql(queries.getDeviceType, [param.devicetype])
      .then(function(types){  
        
        if (types.length === 0) {
            return Promise.reject(new Error('DeviceType not found'));
        }
        
        if(param.value < types[0].min || param.value > types[0].max){
            return Promise.reject(new Error('Incorrect value'));
        }

        if (typeof global[types[0].service].exec !== "function"){
            return Promise.reject(new Error(`${types[0].service} does not exist or does not have an exec function`));
        }
        
        // calling service method
        return global[types[0].service].exec({type: types[0], state:param})
            .then(function(){
                
                // creating DeviceState
                return DeviceState.create(param);
            });     
    });
}