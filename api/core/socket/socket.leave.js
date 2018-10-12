var users = require('./socket.users.js');

module.exports = function join(userId, socketId){

  if(!users[userId] || !users[userId] instanceof Array) {
    return null; 
  }

  var position = users[userId].indexOf(socketId);
  if(position != -1) {
    users[userId].splice(position, 1); 
  }
};