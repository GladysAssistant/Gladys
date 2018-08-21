const uuid = require('uuid');
const Promise = require('bluebird');

/**
 * @public
 * @description This function send an message
 * @name gladys.message.send
 * @param {Object} message
 * @param {User} message.sender The sender of message
 * @param {User} message.receiver The name of message, If it is null then the receveiver is Gladys
 * @param {text} message.text The text of message
 * @param {String} message.service The service of message
 * @returns {Message} message
 * @example
 * var message = {
 *      text: "Hello Gladys !",
 *      service: "Pushbullet"
 * } // the sender is user
 * 
 * var user = {
 *      id: 1
 * }
 * 
 * gladys.message.send(user, message)
 *      .then(function(message){
 *          // message sended
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

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