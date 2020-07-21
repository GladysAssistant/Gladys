const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { LIGHT_MODULES } = require('./modules');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^(StatusSTS|Gladys)\.POWER\d*$/,
  // Gladys feature
  generateFeature: (device, key) => {
    const lightDevice = LIGHT_MODULES.includes(device.model);
    const category = lightDevice ? DEVICE_FEATURE_CATEGORIES.LIGHT : DEVICE_FEATURE_CATEGORIES.SWITCH;
    const type = lightDevice ? DEVICE_FEATURE_TYPES.LIGHT.BINARY : DEVICE_FEATURE_TYPES.SWITCH.BINARY;

    const position = key.replace(/POWER/i, '');
    const name = `Switch ${position}`.trim();

    return {
      category,
      type,
      name,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    };
  },
  // Gladys vs Tasmota transformers
  readValue: (value) => {
    return value === 'ON' ? 1 : 0;
  },
  writeValue: (value) => {
    return value ? 'ON' : 'OFF';
  },
};
