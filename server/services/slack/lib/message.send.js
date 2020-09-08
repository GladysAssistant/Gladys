const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Send Slack message.
 * @param {string} chatId - Slack Chat Id.
 * @param {Object} message - Message object to send.
 * @param {Object} [options] - Options.
 * @example
 * send('11212', {
 *   text: 'Hey'
 * });
 */
function send(chatId, message, options) {
  logger.debug(`Sending Slack message to user with chatId = ${chatId}.`);
  if (!this.bot) {
    throw new ServiceNotConfiguredError('Slack not configured');
  }
  this.bot.sendMessage(message.text, chatId);
}

module.exports = {
  send,
};
