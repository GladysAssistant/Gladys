const logger = require('../../../utils/logger');
const {
  WEBHOOK_ACTIVE_STATUSES,
  WEBHOOK_ENERGY_EVENT_TYPES,
  WEBHOOK_REFRESH_DEBOUNCE_MS,
} = require('./utils/netatmo.constants');

/**
 * @description Handle a Netatmo webhook event relayed by the Gladys Plus gateway.
 * Energy events trigger a debounced devices values refresh; anything else is ignored.
 * @param {object} data - Gateway payload: { user_id, netatmo_data }.
 * @example
 * await netatmo.handleWebhookEvent({ user_id: '...', netatmo_data: { event_type: 'set_point' } });
 */
async function handleWebhookEvent(data) {
  const netatmoData = data ? data.netatmo_data : undefined;
  if (!netatmoData || typeof netatmoData !== 'object') {
    logger.warn('Netatmo: ignoring malformed webhook message');
    return;
  }
  if (!WEBHOOK_ACTIVE_STATUSES.includes(this.status) || !this.configuration.energyApi) {
    logger.debug('Netatmo: ignoring webhook event, service not connected or Energy API disabled');
    return;
  }
  const eventType = netatmoData.event_type;
  if (eventType === 'webhook_activation') {
    logger.info('Netatmo: webhook activated');
    this.webhookRegistered = true;
    return;
  }
  if (!WEBHOOK_ENERGY_EVENT_TYPES.includes(eventType)) {
    logger.debug(`Netatmo: ignoring webhook event type "${eventType}" (push_type "${netatmoData.push_type}")`);
    return;
  }
  logger.debug(`Netatmo: webhook event "${eventType}" received, scheduling a devices values refresh`);
  clearTimeout(this.webhookRefreshTimeout);
  this.webhookRefreshTimeout = setTimeout(() => {
    this.refreshNetatmoValues().catch((e) => {
      logger.error('Netatmo: devices values refresh failed after webhook event - Details: ', e);
    });
  }, WEBHOOK_REFRESH_DEBOUNCE_MS);
}

module.exports = {
  handleWebhookEvent,
};
