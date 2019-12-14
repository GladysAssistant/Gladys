const { BadParameters } = require('../../../../utils/coreErrors');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Set value for switch device.
 * @param {Object} feature - Feature.
 * @param {string|number} value - New value.
 * @returns {Object} A pair object containing command topic and value to emit.
 * @example
 * setSwitchValue(feature);
 */
function setSwitchValue(feature, value) {
  switch (feature.type) {
    case DEVICE_FEATURE_TYPES.SWITCH.BINARY: {
      return { topic: 'power', value: value ? 'ON' : 'OFF' };
    }
    default:
      throw new BadParameters(`Sonoff device type not managed to set value on "${feature.external_id}"`);
  }
}

module.exports = {
  setSwitchValue,
};
