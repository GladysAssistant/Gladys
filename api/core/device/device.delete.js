module.exports = destroy;

var Promise = require('bluebird');

function destroy (options) {
    return Device.destroy({id: options.id})
        .then(function(devices){
           
           if(devices.length === 0){
               return Promise.reject(new Error('Device not found'));
           } 
           
           return Promise.resolve(devices[0]);
        });
}