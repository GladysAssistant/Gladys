const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Send telegram message.
 * @param {string} chatId - Telegram Chat Id.
 * @param {object} message - Message object to send.
 * @param {object} [options] - Options.
 * @example
 * send('11212', {
 *   text: 'Hey'
 * });
 */
function send(chatId, message, options) {
  logger.debug(`Sending Telegram message to user with chatId = ${chatId}.`);
  if (!this.bot) {
    throw new ServiceNotConfiguredError('Telegram not configured');
  }
  const telegramOptions = {};
  if (options && options.suggestion) {
    telegramOptions.reply_markup = {
      one_time_keyboard: true,
      keyboard: options.suggestion,
    };
  }
  this.bot.sendMessage(chatId, message.text, telegramOptions);
  if (message.file) {
    const fileOpts = {
      filename: 'image',
      contentType: 'image/jpg',
    };
    this.bot.sendPhoto(chatId, Buffer.from(message.file.substr(17), 'base64'), fileOpts);
  }
}

module.exports = {
  send,
};
