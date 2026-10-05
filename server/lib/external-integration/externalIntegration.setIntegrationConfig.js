const { BadParameters, ForbiddenError } = require('../../utils/coreErrors');
const { RESERVED_PARAM_PREFIX } = require('./constants');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { getDynamicOptions } = require('./externalIntegration.getDynamicOptions');

const CONFIG_KEY_REGEX = /^[a-z0-9_]+$/;

/**
 * @description Tell if every house of a value is one the user already chose
 * for this field (the stored value). Checked before the existence check, so
 * the answer never depends on whether a guessed house exists.
 * @param {any} value - The select/multi_select value written by the integration.
 * @param {any} storedValue - The value currently stored for the field.
 * @returns {boolean} True when the value only holds houses already chosen.
 * @example
 * isChosenHouseValue('main-house', 'main-house');
 */
function isChosenHouseValue(value, storedValue) {
  if (storedValue === undefined) {
    return false;
  }
  const chosenHouses = Array.isArray(storedValue) ? storedValue : [storedValue];
  const houses = Array.isArray(value) ? value : [value];
  return houses.every((house) => chosenHouses.includes(house));
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
  // back a house already chosen: accepting any other selector would turn
  // the 200/422 answer into an oracle on the houses of the instance
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
    if (
      checkChosenHouses &&
      field &&
      field.source === 'houses' &&
      !isChosenHouseValue(config[key], storedConfig[key])
    ) {
      throw new ForbiddenError(`config.${key}: only a house chosen by the user can be set without location: true`);
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
