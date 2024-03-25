const logger = require('../../../../utils/logger');

/**
 * @description Starts Ecovacs device.
 * @example
 * ecovacs.start();
 */
async function start() {
  logger.debug(`Ecovacs: Starting`);
  const { login, password, countryCode } = await this.getConfiguration();
  if (login || password || countryCode) {
    this.configured = true;
  }
  if (this.configured && !this.connected) {
    await this.connect();
  }
  await this.loadVacbots();
}

module.exports = {
  start,
};
