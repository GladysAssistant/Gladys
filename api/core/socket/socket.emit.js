

module.exports = function(eventName, data, options){
    
    // send message to only one user
    if(options && options.user){
        sails.sockets.broadcast('user' + options.user, eventName, data);    
    } else {
        
        // or to everyone
        sails.sockets.broadcast('everybody', eventName, data);    
    }
};