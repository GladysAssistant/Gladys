const get = require('get-value');
const logger = require('../../../../utils/logger');

/**
 * @description Poll for new message.
 * @param {string} userId - User to send message to.
 * @returns {Promise} - Resolve.
 * @example
 * poll('user1');
 */
async function poll(userId) {
  const bot = this.bots[userId];
  let result = {};
  let interval = 50;

  try {
    const params = {
      method: 'get',
      url: `${bot.NEXTCLOUD_URL}/ocs/v2.php/apps/spreed/api/v1/chat/${bot.token}?timeout=15${
        bot.lastKnownMessageId
          ? `&lookIntoFuture=1&lastKnownMessageId=${bot.lastKnownMessageId}`
          : '&lookIntoFuture=0&includeLastKnown=1'
      }`,
      headers: {
        Authorization: `Basic ${Buffer.from(`${bot.NEXTCLOUD_BOT_USERNAME}:${bot.NEXTCLOUD_BOT_PASSWORD}`).toString(
          'base64',
        )}`,
        Accept: 'application/json',
        'OCS-APIRequest': true,
      },
      timeout: 30 * 1000,
      signal: this.abortController.signal,
      validateStatus: null,
    };
    result = await this.axios.request(params);
    if (result && result.status >= 400) {
      logger.info(`Fail to request new Nextcloud Talk messages status: ${result.status}, retry in 15 seconds`);
      interval = 15 * 1000;
    }
  } catch (e) {
    logger.info('Fail to request new Nextcloud Talk messages, retry in 15 seconds');
    logger.warn(e);
    interval = 15 * 1000;
  }

  const newMessages = get(result, 'data.ocs.data');
  if (
    bot.lastKnownMessageId &&
    bot.isPolling &&
    newMessages &&
    newMessages[newMessages.length - 1].actorId !== bot.NEXTCLOUD_BOT_USERNAME
  ) {
    bot.eventEmitter.emit('message', newMessages.pop());
  }

  if (bot.isPolling) {
    this.bots[userId].lastKnownMessageId = get(result, 'headers.x-chat-last-given') || bot.lastKnownMessageId;
    setTimeout(() => this.poll(userId), interval);
  }
}

module.exports = {
  poll,
};
