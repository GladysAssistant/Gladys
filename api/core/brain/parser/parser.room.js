
module.exports = function(originalText){
  return gladys.room.getAll()
    .then(function(rooms){
        
        var result = [];
        var replaceRegex = '';
           
        // foreach room, we verify if the room is present in the sentence
        rooms.forEach(function(room){
            if(present(originalText, room.name)){
                result.push(room);
                if(replaceRegex.length > 0) replaceRegex += '|';
                replaceRegex += room.name;
            }
        });

        var text = originalText;
        
        if(replaceRegex.length > 0) {
            text = originalText.replace(new RegExp(replaceRegex, 'gi'), '%ROOM%');
        }

        return {
            text, 
            rooms: result
        };
    });
};



/**
 * Return true if the roomName is present in the sentence
 */
function present(text, room){
    if(room) {
        return ((no_accent(text).indexOf(no_accent(room)) > -1));
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