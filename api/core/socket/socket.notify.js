
module.exports = function notify(message, user){
    return gladys.socket.emit('message', message, {user: user.id});
};