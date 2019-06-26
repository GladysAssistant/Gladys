const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Called when a new telegram message arrives.
 * @param {Object} msg - Telegram Message.
 * @returns {Promise} - Resolve with null.
 * @example
 * newMessage({
 * });
 */
async function newMessage(msg) {
  logger.debug(`new message from telegram, ${msg.text}`);
  logger.debug(msg);
  const telegramUserId = msg.from.id;

  if (msg.text.startsWith('/start')) {
    const splitted = msg.text.split(' ');
    await this.linkUser(splitted[1], telegramUserId);
    return null;
  }
  const user = await this.gladys.user.getByTelegramUserId(telegramUserId);

  const message = {
    source: 'telegram',
    source_user_id: telegramUserId,
    user_id: user.id,
    user,
    language: user.language,
    date: msg.date,
    text: msg.text,
  };
  this.gladys.event.emit(EVENTS.MESSAGE.NEW, message);
  return null;
}

module.exports = {
  newMessage,
};
