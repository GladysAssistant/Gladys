module.exports = function(originalText){
    return gladys.deviceType.getAll()
       .then(function(deviceTypes){
           
           var result = [];
           var replaceRegex = '';
           
           // foreach deviceType, we verify if the device is present in the 
           deviceTypes.forEach(function(type){
               if(present(originalText, type.tag)){
                   result.push(type);
                   if(replaceRegex.length > 0) replaceRegex += '|';
                   replaceRegex += type.tag;
               }
           });
           
           var text = originalText;
           if(replaceRegex.length > 0) {
                text = originalText.replace(new RegExp(replaceRegex, 'g'), '%DEVICE_TYPE%');
           }
           
           return {
                text,
                deviceTypes: result
           };
       });
};

/**
 * Return true if the deviceName is present in the sentence
 */
function present(text, type){
    return (text.toLowerCase().indexOf(type ? type.toLowerCase() : type) > -1);
}