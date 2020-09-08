const { connect } = require('./message.connect');
const { linkUser } = require('./message.linkUser');
const { getCustomLink } = require('./message.getCustomLink');
const { newMessage } = require('./message.new');
const { send } = require('./message.send');
const { disconnect } = require('./message.disconnect');

/**
 * @description Add ability to send/receive telegram message.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} NodeSlackBotApi - Node slack bot API.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const SlackHandler = new MessageHandler(gladys, NodeSlackBotApi, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, NodeSlackBotApi, serviceId) {
  this.gladys = gladys;
  this.NodeSlackBotApi = NodeSlackBotApi;
  this.serviceId = serviceId;
  this.bot = null;
};

MessageHandler.prototype.connect = connect;
MessageHandler.prototype.disconnect = disconnect;
MessageHandler.prototype.getCustomLink = getCustomLink;
MessageHandler.prototype.linkUser = linkUser;
MessageHandler.prototype.newMessage = newMessage;
MessageHandler.prototype.send = send;

module.exports = MessageHandler;
