
module.exports = function(text){
  return gladys.room.getAll()
    .then(function(rooms){
        
        var result = [];
           
        // foreach room, we verify if the room is present in the sentence
        rooms.forEach(function(room){
            if(present(text, room.name)){
                result.push(room);
            }
        });

        return result;
    });
};



/**
 * Return true if the roomName is present in the sentence
 */
function present(text, type){
    return (text.indexOf(type.toLowerCase()) > -1);
}