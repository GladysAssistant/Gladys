const uuid = require('uuid');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

/**
 * @description Called when a new Nextcloud Talk message arrives.
 * @param {object} msg - Nextcloud Talk Message.
 * @returns {Promise} - Resolve with null.
 * @example
 * newMessage({...});
 */
async function newMessage(msg) {
  logger.debug(`new message from Nextcloud Talk, ${msg.message}`);

  const nextcloudTalkToken = msg.token;
  const userBot = Object.values(this.bots).find((bot) => bot.token === nextcloudTalkToken);
  const user = await this.gladys.user.getById(userBot.userId);

  const message = {
    source: 'nextcloud-talk',
    source_user_id: nextcloudTalkToken,
    user_id: user.id,
    user,
    language: user.language,
    created_at: new Date(msg.timestamp * 1000).toISOString(),
    text: msg.message,
    id: uuid.v4(),
  };
  this.gladys.event.emit(EVENTS.MESSAGE.NEW, message);
  return null;
}

module.exports = {
  newMessage,
};
