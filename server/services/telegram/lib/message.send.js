const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { markdownToTelegramHtml } = require('./markdownToTelegramHtml');

/**
 * @description Send telegram message.
 * @param {string} chatId - Telegram Chat Id.
 * @param {object} message - Message object to send.
 * @param {object} [options] - Options.
 * @returns {Promise} Resolve when the message is sent.
 * @example
 * send('11212', {
 *   text: 'Hey'
 * });
 */
async function send(chatId, message, options) {
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
  if (message.text) {
    try {
      // answers written by the AI contain Markdown, which Telegram displays
      // as-is unless it is converted to the HTML subset it understands
      await this.bot.sendMessage(chatId, markdownToTelegramHtml(message.text), {
        ...telegramOptions,
        parse_mode: 'HTML',
      });
    } catch (e) {
      // Telegram rejects the whole message when it dislikes one tag: rather
      // than losing the answer, send the raw text without any formatting
      logger.warn(`Telegram: unable to send a formatted message, falling back to plain text.`);
      logger.warn(e);
      await this.bot.sendMessage(chatId, message.text, telegramOptions);
    }
  }
  if (message.file) {
    const fileOpts = {
      filename: 'image',
      contentType: 'image/jpg',
    };
    await this.bot.sendPhoto(chatId, Buffer.from(message.file.substr(17), 'base64'), fileOpts);
  }
}

module.exports = {
  send,
};
