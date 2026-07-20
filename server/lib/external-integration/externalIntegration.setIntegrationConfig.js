const { BadParameters } = require('../../utils/coreErrors');
const { RESERVED_PARAM_PREFIX } = require('./constants');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');

const CONFIG_KEY_REGEX = /^[a-z0-9_]+$/;

/**
 * @description Save config values coming from the integration itself
 * (partial merge). Keys present in the config_schema are validated against
 * it; keys outside the schema are a free internal storage of the integration
 * (pairing state, third party tokens...), never displayed in the UI.
 * No config-updated echo is pushed back (it would loop).
 * @param {object} service - The external integration service.
 * @param {object} config - The partial config to merge.
 * @returns {Promise} Resolve when saved.
 * @example
 * await gladys.externalIntegration.setIntegrationConfig(service, { latitude: 48.85 });
 */
async function setIntegrationConfig(service, config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new BadParameters('config: must be an object');
  }
  const configSchema = (service.manifest && service.manifest.config_schema) || [];
  const keys = Object.keys(config);
  keys.forEach((key) => {
    if (!CONFIG_KEY_REGEX.test(key)) {
      throw new BadParameters(`config.${key}: keys must match [a-z0-9_]`);
    }
    // gladys_* would be uppercased into the reserved GLADYS_* namespace
    // (user preferences like GLADYS_PREFER_LOCAL): read-only for the
    // integration
    if (key.toUpperCase().startsWith(RESERVED_PARAM_PREFIX)) {
      throw new BadParameters(`config.${key}: ${RESERVED_PARAM_PREFIX}* keys are reserved`);
    }
    const field = configSchema.find((schemaField) => schemaField.key === key);
    if (field) {
      validateConfigValue(field, config[key]);
    }
  });
  // t_variable names must be uppercase: keys are uppercased at write time
  // and lowercased back at read time (see getIntegrationConfig)
  await Promise.all(
    keys.map((key) => this.variable.setValue(key.toUpperCase(), JSON.stringify(config[key]), service.id)),
  );
}

module.exports = {
  setIntegrationConfig,
};
