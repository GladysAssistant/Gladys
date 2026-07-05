const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Disconnects service and dependencies.
 * @example
 * await disconnect();
 */
async function disconnect() {
  logger.debug('Disonnecting from Netatmo...');
  this.saveStatus({ statusType: STATUS.DISCONNECTING, message: null });
  this.gladys.event.removeListener(EVENTS.GATEWAY.NEW_MESSAGE_NETATMO_WEBHOOK, this.handleWebhookEventBound);
  clearTimeout(this.webhookRefreshTimeout);
  // the access token is still valid here, before tokens are cleared
  await this.dropWebhook();
  const tokens = {
    accessToken: '',
    refreshToken: '',
    expireIn: 0,
  };
  this.setTokens(tokens);
  this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
  logger.debug('Netatmo disconnected');
}

module.exports = {
  disconnect,
};
