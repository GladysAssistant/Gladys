const getConfig = require('../../utils/getConfig');
const { OPEN_API_KEY_CONFIG_KEY, WEBHOOK_DEFAULT_MODE } = require('./constants');

/**
 * @description True when the manifest declares at least one inbound webhook
 * (Gladys Plus relay, B.17).
 * @param {object} manifest - The integration manifest.
 * @returns {boolean} True when webhooks are declared.
 * @example
 * const declared = hasWebhooks(service.manifest);
 */
function hasWebhooks(manifest) {
  return Boolean(manifest && Array.isArray(manifest.webhooks) && manifest.webhooks.length > 0);
}

/**
 * @description The inbound webhooks of an integration with their
 * availability and ready-to-register URLs. Webhooks need Gladys Plus (the
 * local instance is not reachable from the Internet) AND the user-pasted
 * Open API key (reserved GLADYS_OPEN_API_KEY config secret): without both,
 * available is false and the integration degrades to poll only. The core
 * builds the full URLs of the generic gateway relay route — the URL is the
 * secret, which is why it only exists when the key is set.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<object>} Resolve with { available, webhooks: [{ key, mode, url }] }.
 * @example
 * const { available, webhooks } = await gladys.externalIntegration.getWebhooks(service);
 */
async function getWebhooks(service) {
  const declaredWebhooks = (service.manifest && service.manifest.webhooks) || [];
  if (declaredWebhooks.length === 0) {
    return { available: false, webhooks: [] };
  }
  const config = await this.getIntegrationConfig(service);
  const openApiKey = config[OPEN_API_KEY_CONFIG_KEY];
  // same "Plus linked" definition as gateway.getStatus
  const gatewayRefreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
  const available = gatewayRefreshToken !== null && typeof openApiKey === 'string' && openApiKey.length > 0;
  const { gladysGatewayServerUrl } = getConfig();
  return {
    available,
    webhooks: declaredWebhooks.map((webhook) => ({
      key: webhook.key,
      mode: webhook.mode || WEBHOOK_DEFAULT_MODE,
      url: available
        ? `${gladysGatewayServerUrl}/v1/api/external-integration/${openApiKey}/${service.selector}/${webhook.key}`
        : null,
    })),
  };
}

module.exports = {
  getWebhooks,
  hasWebhooks,
};
