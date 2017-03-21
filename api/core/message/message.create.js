const uuid = require('uuid');

module.exports = function create(message) {
    message.conversation = message.conversation || uuid.v4();
    message.datetime = message.datetime || new Date();
    message.sender = message.sender || null;
    message.receiver = message.receiver || null;

    return Message.create(message);
};