var Promise = require('bluebird');

module.exports = function update(room){
    var id = room.id;
    delete room.id;
    return Room.update({id}, room)
      .then(function(rooms){
          if(rooms.length === 0){
              return Promise.reject(new Error('NotFound'));
          } else {
              return Promise.resolve(rooms[0]);
          }
      });
};