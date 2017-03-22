const uuid = require('uuid');
const Promise = require('bluebird');

module.exports = function send(user, message) {
    message.sender = user.id;

    return gladys.message.create(message)
        .then((message) => {

            // if receiver is null, it's a message for gladys, so we send message to the brain
            if(!message.receiver) gladys.brain.classify(user, message);

            // add firstname to sender
            message.senderName = user.firstname;
            return message;
        }); 
};