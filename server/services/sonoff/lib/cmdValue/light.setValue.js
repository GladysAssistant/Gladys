const { BadParameters } = require('../../../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Set value for light device.
 * @param {Object} feature - Feature.
 * @param {string|number} value - New value.
 * @returns {Object} A pair object containing command topic and value to emit.
 * @example
 * setLightValue(feature);
 */
function setLightValue(feature, value) {
  switch (feature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY: {
      return { topic: 'power', value: value ? 'ON' : 'OFF' };
    }
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
      return {
        topic: 'color',
        value: `#${Number(value)
          .toString(16)
          .padStart(6, '0')}`,
      };
    }
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
      return {
        topic: 'dimmer',
        value,
      };
    }
    default:
      throw new BadParameters(`Sonoff device type not managed to set value on "${feature.external_id}"`);
  }
}

module.exports = {
  setLightValue,
};
