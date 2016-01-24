module.exports = set;

var queries = require('./device.queries.js');

/**
 * Create a new DeviceState. Useful 
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
            
            DeviceState.create(param, function(err, state){
                if(err) return reject(err);
                
                resolve(state); 
            });      
       });
       
    });
}