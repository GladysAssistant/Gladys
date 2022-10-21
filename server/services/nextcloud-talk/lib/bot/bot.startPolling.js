const logger = require('../../../../utils/logger');

/**
 * @description Initiate bot poll
 * @param {string} token - Token of conversation to poll.
 * @returns {Promise} - Resolve.
 * @example
 * startPolling('token1');
 */
async function startPolling(token) {
  logger.debug(`Start polling Nextcloud Talk for token: ${token}`);

  const user = await this.gladys.user.getById(this.bots[token].userId);

  if (!this.bots[token].NEXTCLOUD_URL) {
    this.bots[token].NEXTCLOUD_URL = await this.gladys.variable.getValue('NEXTCLOUD_URL', this.serviceId, user.id);
  }
  if (!this.bots[token].NEXTCLOUD_BOT_USERNAME) {
    this.bots[token].NEXTCLOUD_BOT_USERNAME = await this.gladys.variable.getValue(
      'NEXTCLOUD_BOT_USERNAME',
      this.serviceId,
      user.id,
    );
  }
  if (!this.bots[token].NEXTCLOUD_BOT_PASSWORD) {
    this.bots[token].NEXTCLOUD_BOT_PASSWORD = await this.gladys.variable.getValue(
      'NEXTCLOUD_BOT_PASSWORD',
      this.serviceId,
      user.id,
    );
  }

  this.bots[token].isPolling = true;
  this.poll(token);
}

module.exports = {
  startPolling,
};
