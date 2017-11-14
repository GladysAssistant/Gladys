
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
            text = originalText.replace(new RegExp(replaceRegex, 'g'), '%ROOM%');
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
function present(text, type){
    return (text.toLowerCase().indexOf(type ? type.toLowerCase() : type) > -1);
}