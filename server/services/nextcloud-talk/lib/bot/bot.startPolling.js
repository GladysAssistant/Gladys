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

  this.bots[userId].isPolling = true;
  this.poll(userId);
}

module.exports = {
  startPolling,
};
