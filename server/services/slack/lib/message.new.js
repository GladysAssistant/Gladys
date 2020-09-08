const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Called when a new slack message arrives.
 * @param {Object} msg - Slack Message.
 * @returns {Promise} - Resolve with null.
 * @example
 * newMessage({
 * });
 */
async function newMessage(msg) {
  logger.debug(`new message from slack, ${msg.text}`);
  logger.debug(msg);
  const slackUserId = msg.channel;

  if (msg.text.startsWith('/start')) {
    const splitted = msg.text.split(' ');
    await this.linkUser(splitted[1], slackUserId);
    return null;
  }
  const user = await this.gladys.user.getBySlackUserId(slackUserId);

  const message = {
    source: 'slack',
    source_user_id: slackUserId,
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
