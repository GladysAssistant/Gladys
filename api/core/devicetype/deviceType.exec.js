module.exports = exec;

var Promise = require('bluebird');
var queries = require('./deviceType.queries.js');

/**
 * Set a new state for a device by executing 
 * the related service.
 */
function exec(param) {
    
    return gladys.utils.sql(queries.getDeviceType, [param.devicetype])
        .then(function(types) {

            if (types.length === 0) {
                return Promise.reject(new Error('DeviceType not found'));
            }

            if (param.value < types[0].min || param.value > types[0].max) {
                return Promise.reject(new Error('Incorrect value'));
            }

            if (typeof gladys.modules[types[0].service].exec !== "function") {
                return Promise.reject(new Error(`${types[0].service} does not exist or does not have an exec function`));
            }
            
            
            // if we send true or false, it's valid
            // but it won't insert in db because validator
            // need an integer
            if(param.value === true){
                param.value = 1;
            } else if(param.value === false){
                param.value = 0;
            }
            
            // parseInt value
            param.value = parseInt(param.value);

            // calling service method
            return gladys.modules[types[0].service].exec({
                    deviceType: types[0],
                    state: param
                });
        })
        .then(function() {

            // creating DeviceState
            return gladys.deviceState.create(param);
        })
        .then(function(deviceState){
           
           // broadcast news to everyone
           gladys.socket.emit('newDeviceState', deviceState); 
           
           return deviceState; 
        });
}
