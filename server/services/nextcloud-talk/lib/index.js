const { connect } = require('./message.connect');
const { newMessage } = require('./message.new');
const { send } = require('./message.send');
const { disconnect } = require('./message.disconnect');
const NextcloudTalkBot = require('./message.bot');

/**
 * @description Add ability to send/receive Nextcloud Talk message.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const messageHandler = new MessageHandler(gladys, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.NextcloudTalkBot = NextcloudTalkBot;
  this.serviceId = serviceId;
  this.bots = [];
};

MessageHandler.prototype.connect = connect;
MessageHandler.prototype.disconnect = disconnect;
MessageHandler.prototype.newMessage = newMessage;
MessageHandler.prototype.send = send;

module.exports = MessageHandler;
