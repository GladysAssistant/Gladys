module.exports = exec;

var Promise = require('bluebird');
var queries = require('./deviceType.queries.js');

/**
 * Set a new state for a device by executing 
 * the related service.
 */
function exec(param) {
    
    // handling scenarios
    if(param.hasOwnProperty('params')) param = param.params;

    return gladys.utils.sql(queries.getDeviceType, [param.devicetype])
        .then(function(types) {

            if (types.length === 0) {
                return Promise.reject(new Error('DeviceType not found'));
            }

            if (param.value < types[0].min || param.value > types[0].max) {
                return Promise.reject(new Error('Incorrect value'));
            }
            
            
            // if we send true or false, it's valid
            // but it won't insert in db because validator
            // need an integer
            if(param.value === true || param.value == 'true'){
                param.value = 1;
            } else if(param.value === false || param.value == 'false'){
                param.value = 0;
            }
            
            // parseFloat value
            param.value = parseFloat(param.value);

            var data = {
                deviceType: types[0],
                state: param
            };

            // if the device is not on this machine
            if(types[0].machine && types[0].machine.length) {
                sails.log.debug(`gladys.deviceType.exec : Device is not on this machine. Contacting the remote module on machine ${types[0].machine}`);
                data.machine_id = types[0].machine;
                data.module_slug = types[0].service;
                gladys.emit('devicetype-exec', data);
                return Promise.resolve(true);
            }

            if (!gladys.modules[types[0].service] || typeof gladys.modules[types[0].service].exec !== "function") {
                return Promise.reject(new Error(`${types[0].service} does not exist or does not have an exec function`));
            }

            // calling service method
            return gladys.modules[types[0].service].exec(data);
        })
        .then(function(hasStateFeedback) {
            if(hasStateFeedback === true) return param;

            // creating DeviceState
            return gladys.deviceState.create(param);
        });
}
