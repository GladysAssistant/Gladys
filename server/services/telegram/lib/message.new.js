const uuid = require('uuid');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Called when a new telegram message arrives.
 * @param {object} msg - Telegram Message.
 * @returns {Promise} - Resolve with null.
 * @example
 * newMessage({
 * });
 */
async function newMessage(msg) {
  logger.debug(`new message from telegram, ${msg.text}`);
  logger.debug(msg);

  const telegramUserId = msg.from.id;
  const telegramChatId = msg.chat.id;

  const telegramUserIdString = telegramUserId.toString();

  if (msg.text.startsWith('/start')) {
    const splitted = msg.text.split(' ');
    await this.linkUser(splitted[1], telegramUserIdString);
    return null;
  }

  const user = await this.gladys.user.getByTelegramUserId(telegramUserIdString);

  const message = {
    source: 'telegram',
    source_user_id: telegramChatId,
    user_id: user.id,
    user,
    language: user.language,
    created_at: new Date(msg.date * 1000).toISOString(),
    text: msg.text,
    // We generate ID as uuidv4 as Telegram doesn't give this type of ID
    id: uuid.v4(),
  };
  this.gladys.event.emit(EVENTS.MESSAGE.NEW, message);
  return null;
}

module.exports = {
  newMessage,
};
