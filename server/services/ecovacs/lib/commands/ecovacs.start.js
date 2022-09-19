const logger = require('../../../../utils/logger');

/**
 * @description Starts Ecovacs device.
 * @returns {any} Null.
 * @example
 * ecovacs.start();
 */
async function start() {
  logger.debug(`Ecovacs: Starting`);
  const { accountId, password, countryCode } = await this.getConfiguration();
  logger.debug(`Ecovacs: ${accountId} ${password} ${countryCode}`);
  if (accountId || password || countryCode) {
    this.configured = true;
  }
  if (this.configured && !this.connected) {
    this.connect();
  }
}

module.exports = {
  start,
};
