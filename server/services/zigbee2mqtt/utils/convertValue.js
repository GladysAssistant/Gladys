/**
 * @description Convert Zigbee2mqtt device state into Gladys compliant.
 * @param {string} feature - Device feature.
 * @param {number|string|boolean} value - Device value.
 * @returns {number} Gladys value.
 * @example
 * convertValue('state', 'ON');
 */
function convertValue(feature, value) {
  let result;

  switch (feature) {
    case 'binary': {
      result = value === 'ON' || value === 'true' || value === true ? 1 : 0;
      break;
    }
    // Case for Button devices
    case 'click': {
      result = value;
      break;
    }

    default: {
      switch (typeof value) {
        case 'boolean': {
          result = value ? 1 : 0;
          break;
        }
        case 'number':
        case 'string': {
          result = value;
          break;
        }
        default:
          throw new Error(`Zigbee2mqqt don't handle value "${value}" for feature "${feature}".`);
      }
    }
  }

  return result;
}

module.exports = {
  convertValue,
};
