module.exports = destroy;

function destroy (options) {
    return new Promise(function(resolve, reject){
        Device.destroy({id: options.id}, function(err, devices){
           if(err) return reject(err);
           
           if(devices.length === 0){
               reject({status: 404, message: 'Device not found'});
           }else{
               resolve(devices[0]);
           }
        });
    });   
}