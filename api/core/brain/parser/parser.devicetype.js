module.exports = function(originalText){
    return gladys.deviceType.getAll()
       .then(function(deviceTypes){
 
           var result = [];
           var replaceRegex = '';
           
           // foreach deviceType, we verify if the device is present in the sentence
           deviceTypes.forEach(function(type){
               if(present(originalText, type.tag)) {
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
    if(tag) {
        return ((no_accent(text).indexOf(no_accent(tag)) > -1));
    } else {
        return false;
    }
}

function no_accent(my_string)
    {
        var pattern_accent = new Array(
        /Þ/g, /ß/g, /à/g, /á/g, /â/g, /ã/g, /ä/g, /å/g, /æ/g, /ç/g, /è/g, /é/g, /ê/g, /ë/g, /ì/g, /í/g, /î/g,
        /ï/g, /ð/g, /ñ/g, /ò/g, /ó/g, /ô/g, /õ/g, /ö/g, /ø/g, /ù/g, /ú/g, /û/g, /ü/g, /ý/g, /ý/g, /þ/g, /ÿ/g);
         
        var pattern_replace_accent = new Array(
        "b","s","a","a","a","a","a","a","a","c","e","e","e","e","i","i","i",
        "i","d","n","o","o","o","o","o","o","u","u","u","u","y","y","b","y");

        my_string=my_string.toLowerCase();
         
        for(var i=0;i<pattern_accent.length;i++)
        {
            my_string = my_string.replace(pattern_accent[i],pattern_replace_accent[i]);
        }
        return my_string;
    }