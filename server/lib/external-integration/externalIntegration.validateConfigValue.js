const { Error422 } = require('../../utils/httpErrors');

// Dynamic options of a select/multi_select field: a reserved enum defined
// by the core (see validateManifest). "devices": the options are the
// already-created devices of the integration (value = external_id), so the
// valid values are only known at runtime and are passed in by the caller.
const DYNAMIC_SOURCES = ['devices'];

/**
 * @description Tell if a schema contains at least one field whose options
 * come from a core-defined dynamic source (the valid values must then be
 * resolved before validating).
 * @param {Array} fields - The config_schema/contact_schema/action fields.
 * @returns {boolean} True if a field has a dynamic source.
 * @example
 * if (schemaHasDynamicSource(manifest.config_schema)) { ... }
 */
function schemaHasDynamicSource(fields) {
  return (fields || []).some((field) => DYNAMIC_SOURCES.includes(field.source));
}

/**
 * @description Get the valid values of a select/multi_select field: the
 * static options of the manifest, or the values of the dynamic source when
 * the field declares one.
 * @param {object} field - The config_schema field.
 * @param {object} dynamicOptions - Valid values by source, ex: { devices: ['ext-1'] }.
 * @returns {Array} The valid values of the field.
 * @example
 * getValidValues({ type: 'select', source: 'devices' }, { devices: ['ext-1'] });
 */
function getValidValues(field, dynamicOptions) {
  if (DYNAMIC_SOURCES.includes(field.source)) {
    return (dynamicOptions && dynamicOptions[field.source]) || [];
  }
  return (field.options || []).map((option) => option.value);
}

/**
 * @description Build the "must be one of ..." error suffix, so a field with
 * a dynamic source and nothing to choose from does not end on an empty list.
 * @param {object} field - The config_schema field.
 * @param {Array} validValues - The valid values of the field.
 * @returns {string} The human readable list of valid values.
 * @example
 * describeValidValues({ source: 'devices' }, []);
 */
function describeValidValues(field, validValues) {
  if (validValues.length === 0 && DYNAMIC_SOURCES.includes(field.source)) {
    return `the ${field.source} of the integration (none available yet)`;
  }
  return validValues.join(', ');
}

/**
 * @description Validate one config value against its config_schema field.
 * @param {object} field - The config_schema field.
 * @param {any} value - The value to validate.
 * @param {object} [dynamicOptions] - Valid values of the dynamic sources, ex: { devices: ['ext-1'] }.
 * @returns {any} The validated value.
 * @example
 * validateConfigValue({ key: 'latitude', type: 'number', min: -90, max: 90 }, 48.85);
 */
function validateConfigValue(field, value, dynamicOptions = {}) {
  const { key, type } = field;
  switch (type) {
    case 'string':
    case 'secret':
      if (typeof value !== 'string') {
        throw new Error422(`config.${key}: must be a string`);
      }
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error422(`config.${key}: must be a number`);
      }
      if (field.min !== undefined && value < field.min) {
        throw new Error422(`config.${key}: must be >= ${field.min}`);
      }
      if (field.max !== undefined && value > field.max) {
        throw new Error422(`config.${key}: must be <= ${field.max}`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new Error422(`config.${key}: must be a boolean`);
      }
      break;
    case 'select': {
      const validValues = getValidValues(field, dynamicOptions);
      if (!validValues.includes(value)) {
        throw new Error422(`config.${key}: must be one of ${describeValidValues(field, validValues)}`);
      }
      break;
    }
    case 'multi_select': {
      const validValues = getValidValues(field, dynamicOptions);
      if (
        !Array.isArray(value) ||
        !value.every((item) => validValues.includes(item)) ||
        new Set(value).size !== value.length
      ) {
        throw new Error422(
          `config.${key}: must be an array of unique values among ${describeValidValues(field, validValues)}`,
        );
      }
      break;
    }
    case 'oauth2':
    case 'account_link':
      // the value of these fields is the Connect flow itself: the credentials
      // are stored by the integration under keys outside the schema
      throw new Error422(`config.${key}: ${type} fields cannot be set directly`);
    case 'section':
      // purely presentational intro block: no stored value, its key is
      // never accepted in a config payload
      throw new Error422(`config.${key}: section fields have no value`);
    default:
      throw new Error422(`config.${key}: unknown field type ${type}`);
  }
  return value;
}

module.exports = {
  validateConfigValue,
  schemaHasDynamicSource,
  DYNAMIC_SOURCES,
};
