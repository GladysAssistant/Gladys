module.exports = function(originalText,rooms){
    return gladys.deviceType.getAll()
       .then(function(deviceTypes){
 
           var result = [];
           var replaceRegex = '';
           
           // foreach deviceType, we verify if the device is present in the sentence
           deviceTypes.forEach(function(type){
               if(present(originalText, type.tag) && inroom(rooms, type)) {
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
function present(text, tag){
    return ((text.toLowerCase().indexOf(tag ? tag.toLowerCase() : tag) > -1) && (tag!==null));
}

function inroom (rooms, type) {
    if (rooms.length) {
        return(rooms.find(room => room.id===type.roomId));
    } else {
        return true;
    }

}