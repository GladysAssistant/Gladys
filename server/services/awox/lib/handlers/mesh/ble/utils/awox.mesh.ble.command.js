const { DEVICE_FEATURE_TYPES } = require('../../../../../../../utils/constants');
const { BadParameters } = require('../../../../../../../utils/coreErrors');
const { percentageToValue } = require('../../../../../../../utils/units');

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
      code = [0xd0];
      message = [value];
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
      code = [0xf1];
      const brightness = percentageToValue(value, 1, 127);
      message = [brightness];
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
      code = [0xe2];
      message = [0x04];
      message.push(value % 256);
      message.push(Math.floor(value / 256) % 256);
      message.push(Math.floor(value / 65536) % 256);
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE: {
      code = [0xf0];
      const brightness = percentageToValue(value, 1, 127);
      message = [brightness];
      break;
    }
    default:
      throw new BadParameters(`AwoX - BLEMesh: ${type} feature not managed`);
  }

  return { code, message };
}

module.exports = {
  command,
};
