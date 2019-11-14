/**
 * @description Convert Zigbee2mqtt device state into Gladys compliant.
 * @param {string} feature - Device feature.
 * @param {number|string|boolean} state - Device state.
 * @returns {number} Gladys value.
 * @example
 * convertValue('state', 'ON');
 */
function convertValue(feature, state) {
  let result;

  switch (feature) {
    case 'state': {
      result = state === 'ON' ? 1 : 0;
      break;
    }
    // Case for Button devices
    case 'click': {
      result = state;
      break;
    }

    default: {
      switch (typeof state) {
        case 'boolean': {
          result = state ? 1 : 0;
          break;
        }
        case 'number': {
          result = state;
          break;
        }
        default:
          throw new Error(`Zigbee2mqqt don't handle value "${state}" for feature "${feature}".`);
      }
    }
  }

  return result;
}

module.exports = {
  convertValue,
};
