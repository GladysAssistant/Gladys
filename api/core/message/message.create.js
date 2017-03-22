const uuid = require('uuid');

module.exports = function create(message) {
    message.conversation = message.conversation || uuid.v4();
    message.datetime = message.datetime || new Date();
    message.sender = message.sender || null;
    message.receiver = message.receiver || null;

    if(!message.text || message.text.length == 0) return Promise.reject(new Error('MESSAGE.TEXT_CANNOT_BE_EMPTY'));

    return Message.create(message);
};