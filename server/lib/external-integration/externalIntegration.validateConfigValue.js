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
    default:
      throw new Error422(`config.${key}: unknown field type ${type}`);
  }
  return value;
}

module.exports = {
  validateConfigValue,
};
