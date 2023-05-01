const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Handle a message event.
 * @param {object} message - The message sent by the user.
 * @example
 * message.handleEvent(message);
 */
async function handleEvent(message) {
  try {
    this.event.emit(EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.SENT,
      payload: message,
      userId: message.user.id,
    });
    await this.create(message);
  } catch (e) {
    logger.warn(e);
  }
}

module.exports = {
  handleEvent,
};
