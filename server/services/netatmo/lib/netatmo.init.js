const logger = require('../../../utils/logger');

/**
 * @description Initialize service with properties and connect to devices.
 *
 * If the first refresh attempt fails with a transient error (network, 5xx, 429, or 4xx within the
 * grace window), the service stays initialized and the auto-reconnect cycle is scheduled.
 * @example netatmo.init();
 */
async function init() {
  await this.getConfiguration();
  this.configured = true;
  await this.getAccessToken();
  await this.getRefreshToken();
  try {
    const response = await this.refreshingTokens();
    if (response.success) {
      await this.pollRefreshingToken();
      await this.refreshNetatmoValues();
      await this.pollRefreshingValues();
    }
  } catch (e) {
    if (e && e.transient) {
      logger.warn('Netatmo init: refresh failed transiently, scheduling auto-reconnect: ', e.message);
      this.scheduleReconnectAttempt();
      return;
    }
    throw e;
  }
}

module.exports = {
  init,
};
