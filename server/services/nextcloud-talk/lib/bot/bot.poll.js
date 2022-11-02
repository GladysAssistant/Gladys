const get = require('get-value');
const logger = require('../../../../utils/logger');

/**
 * @description Poll for new message
 * @param {string} token - Token of conversation to poll.
 * @returns {Promise} - Resolve.
 * @example
 * poll('token1');
 */
async function poll(token) {
  const { lastKnownMessageId } = this.bots[token];
  let result = {};

  try {
    result = await this.gladys.http.request(
      'get',
      `${this.bots[token].NEXTCLOUD_URL}/ocs/v2.php/apps/spreed/api/v1/chat/${token}?lookIntoFuture=1&timeout=15${
        lastKnownMessageId ? `&lastKnownMessageId=${lastKnownMessageId}` : ''
      }`,
      '',
      {
        Authorization: `Basic ${Buffer.from(
          `${this.bots[token].NEXTCLOUD_BOT_USERNAME}:${this.bots[token].NEXTCLOUD_BOT_PASSWORD}`,
        ).toString('base64')}`,
        Accept: 'application/json',
        'OCS-APIRequest': true,
      },
    );
  } catch (e) {
    logger.info('Fail to request new Nextcloud Talk messages, retry');
    logger.warn(e);
  }

  const newMessages = get(result, 'data.ocs.data');
  if (
    lastKnownMessageId &&
    this.bots[token].isPolling &&
    newMessages &&
    newMessages[newMessages.length - 1].actorId !== this.bots[token].NEXTCLOUD_BOT_USERNAME
  ) {
    this.bots[token].eventEmitter.emit('message', newMessages.pop());
  }

  if (this.bots[token].isPolling) {
    this.bots[token].lastKnownMessageId = get(result, 'headers.x-chat-last-given') || lastKnownMessageId;
    setTimeout(() => this.poll(token), 50);
  }
}

module.exports = {
  poll,
};
