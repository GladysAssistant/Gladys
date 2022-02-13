const { xyToInt } = require('../../../utils/colors');
const { BUTTON_STATUS } = require('../../../utils/constants');
const { convertParametersValue } = require('./parameters/convertParameterValue');

/**
 * @description Convert Zigbee2mqtt device value into Gladys value.
 * @param {Object} device - Gladys device.
 * @param {string} feature - Device feature.
 * @param {string} property - Zigbee device feature property.
 * @param {number|string|boolean|Object} value - Device value.
 * @returns {number|string|boolean} Gladys value.
 * @example
 * convertValue({ params: [...] }, 'binary', 'alarm', 'ON');
 */
function convertValue(device, feature, property, value) {
  let result;

  // Looks mapping from parameters
  const matchingParamValue = convertParametersValue(device, property, value);
  if (matchingParamValue !== undefined) {
    return matchingParamValue;
  }

  // Or fallback to default mapper
  switch (feature) {
    case 'binary': {
      result = value === 'ON' || value === 'true' || value === true ? 1 : 0;
      break;
    }

    case 'color': {
      result = xyToInt(value.x, value.y);
      break;
    }

    // Case for Button devices
    case 'click': {
      switch (value) {
        case 'single':
          result = BUTTON_STATUS.CLICK;
          break;
        case 'double':
          result = BUTTON_STATUS.DOUBLE_CLICK;
          break;
        case 'hold':
          result = BUTTON_STATUS.LONG_CLICK;
          break;
        default:
          result = value;
      }
      break;
    }

    default: {
      switch (typeof value) {
        case 'boolean': {
          result = value ? 1 : 0;
          break;
        }
        case 'number': {
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
