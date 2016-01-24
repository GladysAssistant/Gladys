module.exports = destroy;

function destroy (id) {
    return new Promise(function(resolve, reject){
        Device.destroy({id: id}, function(err, devices){
           if(err) return reject(err);
           
           if(devices.length === 0){
               reject({err: 404, message: 'Device not found'});
           }else{
               resolve(devices[0]);
           }
        });
    });   
}