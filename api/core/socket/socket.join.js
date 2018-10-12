var users = require('./socket.users.js');

module.exports = function join(userId, socketId){
    
  // join the global room
  sails.sockets.join(socketId, 'everybody', function(err){
    if(err) {
      sails.log.error(err); 
    }
  });
    
  users[userId] = users[userId] || [];

  if(users[userId].indexOf(socketId) == -1) {
    users[userId].push(socketId); 
  }
};