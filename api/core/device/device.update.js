module.exports = update;

/**
 * Update a device. 
 * You should pass an object with the id
 * of the device to update + the property you want to update
 * Ex: { id: 1, name: 'New name of my lamp' }
 */
function update(device){
   return new Promise(function(resolve, reject){
        var id = device.id;
        delete device.id;
        Device.update({id: id}, device, function(err, devices){
           if(err) return reject(err);
           
           if(devices.length === 0){
               return reject({status: 404, message: 'Device not found'});
           }
           
           resolve(devices[0]); 
        });        
   });
}