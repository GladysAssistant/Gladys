const { connect } = require('./message/message.connect');
const { newMessage } = require('./message/message.new');
const { send } = require('./message/message.send');
const { disconnect } = require('./message/message.disconnect');
const { startPolling } = require('./bot/bot.startPolling');
const { stopPolling } = require('./bot/bot.stopPolling');
const { poll } = require('./bot/bot.poll');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');

/**
 * @description Add ability to send/receive Nextcloud Talk message.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @param {object} axios - Axios library.
 * @example
 * const messageHandler = new MessageHandler(gladys, serviceId, axios);
 */
const MessageHandler = function MessageHandler(gladys, serviceId, axios) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.axios = axios;
  this.bots = {};
  this.newMessageCb = eventFunctionWrapper(newMessage.bind(this));
};

MessageHandler.prototype.connect = connect;
MessageHandler.prototype.disconnect = disconnect;
MessageHandler.prototype.newMessage = newMessage;
MessageHandler.prototype.send = send;
MessageHandler.prototype.startPolling = startPolling;
MessageHandler.prototype.stopPolling = stopPolling;
MessageHandler.prototype.poll = poll;

module.exports = MessageHandler;
