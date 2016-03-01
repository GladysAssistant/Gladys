module.exports = update;

var Promise = require('bluebird');

function update(device){
   var id = device.id;
   delete device.id;
   
   // update the device
   return Device.update({id: id}, device)
        .then(function(devices){
            
            if(devices.length === 0){
                return Promise.reject(new Error('Device not found'));
            }
            
            return Promise.resolve(devices[0]);
        });        
}