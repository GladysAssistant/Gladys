
module.exports = function(data){
  return gladys.room.getAll()
    .then(function(rooms){
        
      var result = [];
      var replaceRegex = '';
      var answerRoom = false;

      // foreach room, we verify if the room is present in the sentence
      rooms.forEach(function(room){
        if(data.roomOrigin && present(data.roomOrigin, room.name)){
          answerRoom = room;
        }
        if(present(data.text, room.name)){
          result.push(room);
          if(replaceRegex.length > 0) { 
            replaceRegex += '|'; 
          };
          replaceRegex += room.name;
        }
      });
   
      // If no room provided in text while roomOrigin is set, we consider user want to apply action inside the originRoom
      if(!result.length && answerRoom) {
        result.push(answerRoom);
      }

      var text = data.text;
        
      if(replaceRegex.length > 0) {
        text = data.text.replace(new RegExp(replaceRegex, 'gi'), '%ROOM%');
      }

      return {
        text, 
        rooms: result,
        answerRoom: answerRoom
      };
    });
};



/**
 * Return true if the roomName is present in the sentence
 */
function present(text, room){
  if(room) {
    if(!Array.isArray(text)) {
      return ((noAccent(text).indexOf(noAccent(room)) > -1));
    } else {
      for(var i = 0; i < text.length; i++) {
        if(noAccent(text[i]).indexOf(noAccent(room)) > -1) {
          return true;
        }
      } 
    }
    return false;
  } else {
    return false;
  }
}

function noAccent(myString) {
  var patternAccent = new Array(
    /Þ/g, /ß/g, /à/g, /á/g, /â/g, /ã/g, /ä/g, /å/g, /æ/g, /ç/g, /è/g, /é/g, /ê/g, /ë/g, /ì/g, /í/g, /î/g,
    /ï/g, /ð/g, /ñ/g, /ò/g, /ó/g, /ô/g, /õ/g, /ö/g, /ø/g, /ù/g, /ú/g, /û/g, /ü/g, /ý/g, /ý/g, /þ/g, /ÿ/g);
         
  var patternReplaceAccent = new Array(
    'b', 's', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'c', 'e', 'e', 'e', 'e', 'i', 'i', 'i',
    'i', 'd', 'n', 'o', 'o', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'y', 'y', 'b', 'y');

  myString= myString.toLowerCase();
         
  for(var i=0;i<patternAccent.length;i++) {
    myString = myString.replace(patternAccent[i], patternReplaceAccent[i]);
  }
  return myString;
}
