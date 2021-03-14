const { DEVICE_FEATURE_TYPES } = require('../../../../../../utils/constants');
const { BadParameters } = require('../../../../../../utils/coreErrors');
const { percentageToValue } = require('../../../../../../utils/units');

/**
 * @description Determine command to apply.
 * @param {Object} deviceFeature - Device feature.
 * @param {number} value - Expected value.
 * @returns {Object} Command object as { code, message }.
 * @example
 * command({ type: 'binary' ...}, 1);
 */
function command(deviceFeature, value) {
  const { type } = deviceFeature;

  let code;
  let message;
  switch (type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      code = 0x0a;
      message = [value];
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
      code = 0x0c;
      const brightness = percentageToValue(value, 2, 11);
      message = [brightness];
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR:
      code = 0x0d;
      message = [
        value === 0 ? 2 : 1,
        value % 256,
        Math.floor(value / 256) % 256,
        Math.floor(value / 65536) % 256,
        0,
        0,
      ];
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE: {
      code = 0x0e;
      const temperature = percentageToValue(value, 2, 11);
      message = [temperature];
      break;
    }
    default:
      throw new BadParameters(`AwoX - Legacy: ${type} feature not managed`);
  }

  return { code, message };
}

module.exports = {
  command,
};
