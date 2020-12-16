const { setup } = require('./message.setup');
const { send } = require('./message.send');

/**
 * @description Add ability to send pushover messages.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const rtspCameraHandler = new RtspCameraHandler(gladys, ffmpeg, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, serviceId) { 
  this.gladys = gladys;
  this.serviceId = serviceId;
};

MessageHandler.prototype.setup = setup;
MessageHandler.prototype.send = send;


module.exports = MessageHandler;
