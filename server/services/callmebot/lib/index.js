const { send } = require('./message.send');
const { sendToUser } = require('./message.sendToUser');

/**
 * @description Add ability to send messages through CallMeBot.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const callmebotHandler = new CallMeBotHandler(gladys, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

MessageHandler.prototype.send = send;
MessageHandler.prototype.sendToUser = sendToUser;

module.exports = MessageHandler;
