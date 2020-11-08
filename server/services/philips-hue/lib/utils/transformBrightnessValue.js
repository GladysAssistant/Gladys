const { LIGHT_BRIGHTNESS } = require('../utils/consts');
const { DIMMER_VALUES } = require('../../../../utils/constants');

/**
 * @description Transform dimmer value into Philips Hue Light Brightness value.
 * @param {Object} value - The value to transform.
 * @returns {number} Philips Hue Light Brightness value.
 * @example
 * transformBrightnessValue(9);
 */
function transformBrightnessValue(value) {
  if (Number(value) >= DIMMER_VALUES.MAX) {
    return LIGHT_BRIGHTNESS.MAX;
  }
  if (Number(value) <= DIMMER_VALUES.MIN) {
    return LIGHT_BRIGHTNESS.MIN;
  }
  return Math.round(Number(value) * LIGHT_BRIGHTNESS.MAX / DIMMER_VALUES.MAX);
}

module.exports = {
  transformBrightnessValue
};
