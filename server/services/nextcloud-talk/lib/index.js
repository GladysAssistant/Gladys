const { connect } = require('./message/message.connect');
const { newMessage } = require('./message/message.new');
const { send } = require('./message/message.send');
const { disconnect } = require('./message/message.disconnect');
const { startPolling } = require('./bot/bot.startPolling');
const { stopPolling } = require('./bot/bot.stopPolling');
const { poll } = require('./bot/bot.poll');

/**
 * @description Add ability to send/receive Nextcloud Talk message.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const messageHandler = new MessageHandler(gladys, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.bots = {};
};

MessageHandler.prototype.connect = connect;
MessageHandler.prototype.disconnect = disconnect;
MessageHandler.prototype.newMessage = newMessage;
MessageHandler.prototype.send = send;
MessageHandler.prototype.startPolling = startPolling;
MessageHandler.prototype.stopPolling = stopPolling;
MessageHandler.prototype.poll = poll;

module.exports = MessageHandler;
