var users = require('./socket.users.js');
const Promise = require('bluebird');

module.exports = function(eventName, data, options){
    
    // send message to only one user
    if(options && options.user){

        // test if user is connected
        if(users[options.user] && users[options.user].length > 0) {
            sails.sockets.broadcast(users[options.user], eventName, data);  
            return Promise.resolve(); 
        } else {

            // if no, reject
            return Promise.reject(new Error(`Socket : emit : User ${options.user} is not connected`));
        }
    } else {
        
        // or to everyone
        sails.sockets.broadcast('everybody', eventName, data); 
        return Promise.resolve();   
    }
};