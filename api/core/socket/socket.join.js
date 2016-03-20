
module.exports = function join(userId, socketId){
    
    // join the global room
    sails.sockets.join(socketId, 'everybody', function(err){
        if(err) sails.log.error(err);
        
        sails.log.debug(`User ${userId} subscribed to room everybody`);
    });
    
    // join his own room
    sails.sockets.join(socketId, 'user' + userId, function(err){
        if(err) sails.log.error(err);
        
        sails.log.debug(`User ${userId} subscribed to his own room`);
    });
};