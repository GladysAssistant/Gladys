const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: (channel = 0) => {
    return {
      name: 'Switch'.concat(channel > 0 ? ` ${channel}` : ''),
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    };
  },
  // Gladys vs eWeLink transformers
  readValue: (value) => {
    return value === 'on' ? STATE.ON : STATE.OFF;
  },
  writeValue: (value) => {
    return value ? 'on' : 'off';
  },
};
