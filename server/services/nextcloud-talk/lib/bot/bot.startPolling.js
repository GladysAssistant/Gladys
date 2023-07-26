const logger = require('../../../../utils/logger');

/**
 * @description Initiate bot poll.
 * @param {string} userId - User to send message to.
 * @returns {Promise} - Resolve.
 * @example
 * startPolling('user1');
 */
async function startPolling(userId) {
  logger.debug(`Start polling Nextcloud Talk for user: ${userId}`);

  this.bots[userId].NEXTCLOUD_URL = await this.gladys.variable.getValue('NEXTCLOUD_URL', this.serviceId, userId);
  this.bots[userId].NEXTCLOUD_BOT_USERNAME = await this.gladys.variable.getValue(
    'NEXTCLOUD_BOT_USERNAME',
    this.serviceId,
    userId,
  );
  this.bots[userId].NEXTCLOUD_BOT_PASSWORD = await this.gladys.variable.getValue(
    'NEXTCLOUD_BOT_PASSWORD',
    this.serviceId,
    userId,
  );

  if (
    !this.bots[userId].NEXTCLOUD_URL ||
    !this.bots[userId].NEXTCLOUD_BOT_USERNAME ||
    !this.bots[userId].NEXTCLOUD_BOT_PASSWORD
  ) {
    logger.debug(`Cancel Nextcloud Talk bot starting for user: ${userId}, missing configuration`);
    delete this.bots[userId];
    return;
  }

  try {
    const params = {
      method: 'get',
      url: `${this.bots[userId].NEXTCLOUD_URL}/ocs/v2.php/apps/spreed/api/v1/chat/${this.bots[userId].token}?timeout=15&lookIntoFuture=0&includeLastKnown=1`,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.bots[userId].NEXTCLOUD_BOT_USERNAME}:${this.bots[userId].NEXTCLOUD_BOT_PASSWORD}`,
        ).toString('base64')}`,
        Accept: 'application/json',
        'OCS-APIRequest': true,
      },
      timeout: 30 * 1000,
      signal: this.abortController.signal,
      validateStatus: null,
    };
    const { status } = await this.axios.request(params);
    if (status >= 400) {
      logger.info(
        `Can't reach Nextcloud instance status: ${status}, cancel Nextcloud bot creation for user: ${userId}`,
      );
      delete this.bots[userId];
      return;
    }
  } catch (e) {
    logger.info(`Can't reach Nextcloud instance, cancel Nextcloud bot creation for user: ${userId}`);
    logger.warn(e);
    delete this.bots[userId];
    return;
  }

  this.bots[userId].isPolling = true;
  this.bots[userId].eventEmitter.on('message', this.newMessageCb);
  this.poll(userId);
}

module.exports = {
  startPolling,
};
