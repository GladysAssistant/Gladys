const { Error422 } = require('../../utils/httpErrors');
const { BadParameters } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { hasDualTransports } = require('./externalIntegration.getIntegrationConfig');
const { hasWebhooks } = require('./externalIntegration.getWebhooks');
const { PREFER_LOCAL_CONFIG_KEY, OPEN_API_KEY_CONFIG_KEY } = require('./constants');

/**
 * @description Save the config coming from the frontend Configuration screen
 * (form generated from the config_schema). The payload is strictly validated
 * against the config_schema (422 otherwise), a `secret` set to null means
 * unchanged, then the complete new config is pushed to the integration over
 * WebSocket (config-updated) so it reloads without a restart.
 * @param {string} selector - The selector of the external integration.
 * @param {object} config - The config values.
 * @returns {Promise<object>} Resolve with { config, configured_secrets }.
 * @example
 * await gladys.externalIntegration.saveConfigFromFront('ext-dev-demo', { latitude: 48.85 });
 */
async function saveConfigFromFront(selector, config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new BadParameters('config: must be an object');
  }
  const service = await this.getBySelector(selector);
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const valuesToSave = {};
  Object.keys(config).forEach((key) => {
    // the standard "prefer local" toggle is a reserved key outside the
    // schema, only meaningful when the manifest declares both transports
    if (key === PREFER_LOCAL_CONFIG_KEY && hasDualTransports(service.manifest)) {
      if (typeof config[key] !== 'boolean') {
        throw new Error422(`config.${key}: must be a boolean`);
      }
      valuesToSave[key] = config[key];
      return;
    }
    // the Gladys Plus Open API key feeding the webhook relay is a reserved
    // secret outside the schema too, only meaningful when the manifest
    // declares webhooks (user-pasted; writable from the front only)
    if (key === OPEN_API_KEY_CONFIG_KEY && hasWebhooks(service.manifest)) {
      if (config[key] === null) {
        // secret semantics: null means unchanged
        return;
      }
      if (typeof config[key] !== 'string' || config[key].length === 0) {
        throw new Error422(`config.${key}: must be a non-empty string`);
      }
      valuesToSave[key] = config[key];
      return;
    }
    const field = configSchema.find((schemaField) => schemaField.key === key);
    if (!field) {
      throw new Error422(`config.${key}: unknown config key`);
    }
    if (field.type === 'secret' && config[key] === null) {
      // a secret set to null means unchanged
      return;
    }
    validateConfigValue(field, config[key]);
    valuesToSave[key] = config[key];
  });
  // t_variable names must be uppercase (see getIntegrationConfig)
  await Promise.all(
    Object.keys(valuesToSave).map((key) =>
      this.variable.setValue(key.toUpperCase(), JSON.stringify(valuesToSave[key]), service.id),
    ),
  );
  // push the complete new values to the integration, so it reloads its
  // config without a restart (only for changes coming from the frontend,
  // never echoed for a POST /config of the integration itself)
  const fullConfig = await this.getIntegrationConfig(service);
  this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONFIG_UPDATED, { config: fullConfig });
  if (Object.prototype.hasOwnProperty.call(valuesToSave, OPEN_API_KEY_CONFIG_KEY)) {
    // the webhook URLs contain the key: a new key means new URLs, the
    // integration re-registers them at the third party
    this.sendMessage(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_UPDATED,
      await this.getWebhooks(service),
    );
  }
  return this.getConfigForFront(selector);
}

module.exports = {
  saveConfigFromFront,
};
