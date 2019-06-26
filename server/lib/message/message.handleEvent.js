const logger = require('../../utils/logger');

/**
 * @description Handle a message event.
 * @param {Object} message - The message sent by the user.
 * @example
 * message.handleEvent(message);
 */
async function handleEvent(message) {
  try {
    await this.create(message);
  } catch (e) {
    logger.warn(e);
  }
}

module.exports = {
  handleEvent,
};
