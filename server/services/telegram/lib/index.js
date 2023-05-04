const { connect } = require('./message.connect');
const { linkUser } = require('./message.linkUser');
const { getCustomLink } = require('./message.getCustomLink');
const { newMessage } = require('./message.new');
const { send } = require('./message.send');
const { disconnect } = require('./message.disconnect');

/**
 * @description Add ability to send/receive telegram message.
 * @param {object} gladys - Gladys instance.
 * @param {object} NodeTelegramBotApi - Node telegram bot API.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const rtspCameraHandler = new RtspCameraHandler(gladys, ffmpeg, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, NodeTelegramBotApi, serviceId) {
  this.gladys = gladys;
  this.NodeTelegramBotApi = NodeTelegramBotApi;
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
