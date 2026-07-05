const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Initialize service with properties and connect to devices.
 *
 * If the first refresh attempt fails with a transient error (network, 5xx, 429, or 4xx within the
 * grace window), the service stays initialized and the auto-reconnect cycle is scheduled.
 * @example netatmo.init();
 */
async function init() {
  // remove first so repeated starts never subscribe twice to the gateway webhook event
  this.gladys.event.removeListener(EVENTS.GATEWAY.NEW_MESSAGE_NETATMO_WEBHOOK, this.handleWebhookEventBound);
  this.gladys.event.on(EVENTS.GATEWAY.NEW_MESSAGE_NETATMO_WEBHOOK, this.handleWebhookEventBound);
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
      // fire-and-forget: webhook registration is best-effort and must not block the startup
      this.registerWebhook().catch((e) => {
        logger.warn('Netatmo: webhook registration failed at init - Details: ', e);
      });
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
