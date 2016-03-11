
module.exports = function(text){
    return gladys.deviceType.getAll()
       .then(function(deviceTypes){
           
           var result = [];
           
           // foreach deviceType, we verify if the device is present in the 
           deviceTypes.forEach(function(type){
               if(present(text, type.tag)){
                   result.push(type);
               }
           });
           
           return result;
       });
};

/**
 * Return true if the deviceName is present in the sentence
 */
function present(text, type){
    return (text.indexOf(type) > -1);
}