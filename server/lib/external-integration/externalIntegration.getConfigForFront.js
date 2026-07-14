/**
 * @description Get the config of an integration for the frontend
 * Configuration screen: only the keys declared in the config_schema are
 * returned (keys outside the schema are internal storage of the
 * integration), and `secret` values are never sent back in clear — they are
 * always null, with a `configured_secrets` flag saying if they are set.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with { config, configured_secrets }.
 * @example
 * const { config, configured_secrets } = await gladys.externalIntegration.getConfigForFront('ext-dev-demo');
 */
async function getConfigForFront(selector) {
  const service = await this.getBySelector(selector);
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const fullConfig = await this.getIntegrationConfig(service);
  const config = {};
  const configuredSecrets = [];
  configSchema.forEach((field) => {
    const hasValue = Object.prototype.hasOwnProperty.call(fullConfig, field.key);
    if (field.type === 'secret') {
      config[field.key] = null;
      if (hasValue) {
        configuredSecrets.push(field.key);
      }
    } else {
      config[field.key] = hasValue ? fullConfig[field.key] : null;
    }
  });
  return {
    config,
    configured_secrets: configuredSecrets,
  };
}

module.exports = {
  getConfigForFront,
};
