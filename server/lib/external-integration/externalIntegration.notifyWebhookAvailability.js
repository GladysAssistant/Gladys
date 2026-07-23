const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { hasWebhooks } = require('./externalIntegration.getWebhooks');

/**
 * @description Push the fresh webhook availability to every integration
 * declaring webhooks, after a Gladys Plus link status change (linked /
 * unlinked). The key change path pushes its own update from
 * saveConfigFromFront; disconnected integrations catch up at reconnection
 * (the contract is a GET /webhook resync, like /device and /config).
 * @returns {Promise} Resolve when pushed.
 * @example
 * await gladys.externalIntegration.notifyWebhookAvailability();
 */
async function notifyWebhookAvailability() {
  const services = await this.get();
  await Promise.all(
    services
      .filter((service) => hasWebhooks(service.manifest))
      .map(async (service) => {
        const payload = await this.getWebhooks(service);
        this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_UPDATED, payload);
      }),
  );
}

module.exports = {
  notifyWebhookAvailability,
};
