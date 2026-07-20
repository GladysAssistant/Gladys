const { Error422 } = require('../../utils/httpErrors');

/**
 * @description Validate one config value against its config_schema field.
 * @param {object} field - The config_schema field.
 * @param {any} value - The value to validate.
 * @returns {any} The validated value.
 * @example
 * validateConfigValue({ key: 'latitude', type: 'number', min: -90, max: 90 }, 48.85);
 */
function validateConfigValue(field, value) {
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
      const validValues = (field.options || []).map((option) => option.value);
      if (!validValues.includes(value)) {
        throw new Error422(`config.${key}: must be one of ${validValues.join(', ')}`);
      }
      break;
    }
    case 'multi_select': {
      const validValues = (field.options || []).map((option) => option.value);
      if (
        !Array.isArray(value) ||
        !value.every((item) => validValues.includes(item)) ||
        new Set(value).size !== value.length
      ) {
        throw new Error422(`config.${key}: must be an array of unique values among ${validValues.join(', ')}`);
      }
      break;
    }
    case 'oauth2':
      // the value of an oauth2 field is the Connect flow itself: the tokens
      // are stored by the integration under keys outside the schema
      throw new Error422(`config.${key}: oauth2 fields cannot be set directly`);
    default:
      throw new Error422(`config.${key}: unknown field type ${type}`);
  }
  return value;
}

module.exports = {
  validateConfigValue,
};
