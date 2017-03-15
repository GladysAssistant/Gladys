const uuid = require('uuid');

module.exports = function send(user, message) {
    message.sender = user.id;

    // if receiver is null, it's a message for gladys
    if(!message.receiver) return sendMessageGladys(user, message);
    else sendMessageUser(message);
};

function sendMessageUser(message) {
    return gladys.message.create(message)
        .then((newMessage) => {
            return {
                message: newMessage
            };
        });
}

function sendMessageGladys(user, message) {

    // first, classify the message
    return gladys.brain.classify(message.text, user.language)
        .then((results) => {

            var responses = [];

            results.forEach(function(result) {
                responses.push(result.response);
            });

            // save the message in DB
            return gladys.message.create(message)
                .then((message) => {
                    return {message, responses};
                });
        });
}