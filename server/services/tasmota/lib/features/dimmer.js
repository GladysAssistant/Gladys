const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { LIGHT_MODULES } = require('./modules');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^(StatusSTS|Gladys)\.Dimmer$/,
  // Gladys feature
  generateFeature: (device) => {
    const lightDevice = LIGHT_MODULES.includes(device.model);
    const category = lightDevice ? DEVICE_FEATURE_CATEGORIES.LIGHT : DEVICE_FEATURE_CATEGORIES.SWITCH;
    const type = lightDevice ? DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS : DEVICE_FEATURE_TYPES.SWITCH.DIMMER;
    const name = lightDevice ? 'Brightness' : 'Dimmer';

    return {
      category,
      type,
      name,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 100,
    };
  },
};
