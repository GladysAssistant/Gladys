const uuid = require('uuid');

module.exports = function create(message) {
    message.conversation = message.conversation || uuid.v4();
    message.datetime = message.datetime || new Date();

    return Message.create(message);
};