module.exports = set;

var queries = require('./device.queries.js');

/**
 * Set a new state for a device by executing 
 * the related service.
 */
function set (param) {
    return new Promise(function(resolve, reject){
       DeviceType.query(queries.getDeviceType, [param.devicetype], function(err, types){
            if(err) return reject(err);
            
            if (types.length === 0) {
                return reject({code: 404, message: 'DeviceType not found'});
            }
            
            if(param.value < types[0].min || param.value > types[0].max){
                return reject({code: 422, message: 'Incorrect value.'});
            }

            
            if (typeof global[types[0].service] !== "function"){
                return reject({code: 500, message: 'Service does not exist'});
            }
            
            // calling service method
            return global[types[0].service].exec(types[0])
                .then(function(){
                    
                    // creating DeviceState
                    return createState(param);
                });     
       });
       
    });
}


function createState (param){
    return new Promise(function(resolve, reject){
        DeviceState.create(param, function(err, state){
                if(err) return reject(err);
                
                resolve(state); 
            }); 
    });
}