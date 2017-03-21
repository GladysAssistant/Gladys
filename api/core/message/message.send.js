const uuid = require('uuid');
const Promise = require('bluebird');

module.exports = function send(user, message) {
    message.sender = user.id;

    // if receiver is null, it's a message for gladys, so we send message to the brain
    if(!message.receiver) gladys.brain.classify(user, message);

    return gladys.message.create(message);
};