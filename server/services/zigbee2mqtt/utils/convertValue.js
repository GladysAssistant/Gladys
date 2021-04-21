const { BUTTON_STATUS } = require('../../../utils/constants');

/**
 * @description Convert Zigbee2mqtt device value into Gladys value.
 * @param {string} feature - Device feature.
 * @param {number|string|boolean} value - Device value.
 * @returns {number|string|boolean} Gladys value.
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
