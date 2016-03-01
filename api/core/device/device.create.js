module.exports = create;



/**
 * Create a Device and its DeviceType.
 */
function create (param) {
    return new Promise(function(resolve, reject){
        
        // insert the device
        Device.create(param.device, function(err, device){
           if(err) return reject(err);
           
           // foreach type of the device, insert it
           async.map(param.types, function(type, cb) {

              type.device = device.id;
              DeviceType.create(type, cb); 
           }, function(err, types){
               if(err) return reject(err);

               var result = {
                   device: device,
                   types: types
               };
               resolve(result);
           });
        });
    });
}