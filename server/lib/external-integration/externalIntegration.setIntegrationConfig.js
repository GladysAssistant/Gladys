const { BadParameters, ForbiddenError } = require('../../utils/coreErrors');
const { RESERVED_PARAM_PREFIX } = require('./constants');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { getDynamicOptions } = require('./externalIntegration.getDynamicOptions');

const CONFIG_KEY_REGEX = /^[a-z0-9_]+$/;

/**
 * @description Tell if a value leaves the stored value of its field
 * unchanged (a write-back of the whole config). The stored value may itself
 * have been written by the integration (a key outside the schema of an older
 * manifest), so it is never trusted as a user choice: an unchanged value is
 * simply a no-op that is not re-validated.
 * @param {any} value - The value written by the integration.
 * @param {any} storedValue - The value currently stored for the field.
 * @returns {boolean} True when the value equals the stored one.
 * @example
 * isUnchangedValue('main-house', 'main-house');
 */
function isUnchangedValue(value, storedValue) {
  return storedValue !== undefined && JSON.stringify(value) === JSON.stringify(storedValue);
}

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
  // a select/multi_select can take its options from a core-defined source
  // ("devices", "houses"): the valid values are only known at runtime
  const dynamicOptions = await getDynamicOptions(service, configSchema);
  const keys = Object.keys(config);
  // a `houses` field is chosen by the user. Without `location: true` (the
  // right to read the houses, GET /house), the integration may only write
  // its stored value back unchanged, and that write is not re-validated: the
  // answer then only depends on values the integration already holds (what
  // it posts, what GET /config returns), never on which houses exist —
  // otherwise 200 versus 422 would be an oracle on the houses of the instance
  const writesHouseField = keys.some((key) =>
    configSchema.some((field) => field.key === key && field.source === 'houses'),
  );
  const checkChosenHouses = writesHouseField && service.manifest.location !== true;
  const storedConfig = checkChosenHouses ? await this.getIntegrationConfig(service) : {};
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
    if (checkChosenHouses && field && field.source === 'houses') {
      if (!isUnchangedValue(config[key], storedConfig[key])) {
        throw new ForbiddenError(
          `config.${key}: only the house chosen by the user can be written back without location: true`,
        );
      }
      return;
    }
    if (field) {
      validateConfigValue(field, config[key], dynamicOptions);
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
