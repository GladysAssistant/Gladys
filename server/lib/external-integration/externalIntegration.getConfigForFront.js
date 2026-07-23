const { PREFER_LOCAL_CONFIG_KEY, OPEN_API_KEY_CONFIG_KEY } = require('./constants');
const { hasDualTransports } = require('./externalIntegration.getIntegrationConfig');
const { hasWebhooks } = require('./externalIntegration.getWebhooks');

/**
 * @description Get the config of an integration for the frontend
 * Configuration screen: only the keys declared in the config_schema are
 * returned (keys outside the schema are internal storage of the
 * integration), and `secret` values are never sent back in clear — they are
 * always null, with a `configured_secrets` flag saying if they are set.
 * When the manifest declares both transports, the reserved
 * GLADYS_PREFER_LOCAL preference is included too (the standard toggle).
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with { config, configured_secrets }.
 * @example
 * const { config, configured_secrets } = await gladys.externalIntegration.getConfigForFront('ext-dev-demo');
 */
async function getConfigForFront(selector) {
  const service = await this.getBySelector(selector);
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const fullConfig = await this.getIntegrationConfig(service);
  const preferLocal = hasDualTransports(service.manifest) ? fullConfig[PREFER_LOCAL_CONFIG_KEY] : undefined;
  const config = {};
  const configuredSecrets = [];
  configSchema.forEach((field) => {
    if (field.type === 'section') {
      // purely presentational intro block: no value to expose
      return;
    }
    const hasValue = Object.prototype.hasOwnProperty.call(fullConfig, field.key);
    if (field.type === 'secret') {
      config[field.key] = null;
      if (hasValue) {
        configuredSecrets.push(field.key);
      }
    } else if (field.type === 'oauth2') {
      // nothing is ever stored under an oauth2 key (tokens live off-schema):
      // the front renders a Connect button, fed by connection_status
      config[field.key] = null;
    } else {
      config[field.key] = hasValue ? fullConfig[field.key] : null;
    }
  });
  if (preferLocal !== undefined) {
    config[PREFER_LOCAL_CONFIG_KEY] = preferLocal;
  }
  if (hasWebhooks(service.manifest)) {
    // the Gladys Plus Open API key is a reserved secret outside the
    // schema: never echoed back, only the "configured" flag
    config[OPEN_API_KEY_CONFIG_KEY] = null;
    if (Object.prototype.hasOwnProperty.call(fullConfig, OPEN_API_KEY_CONFIG_KEY)) {
      configuredSecrets.push(OPEN_API_KEY_CONFIG_KEY);
    }
  }
  return {
    config,
    configured_secrets: configuredSecrets,
  };
}

module.exports = {
  getConfigForFront,
};
