const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.ENERGY\.Power$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
      name: 'Power',
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.KILOWATT,
    };
  },
  generateExternalId: (key) => {
    return `ENERGY:${key}`;
  },
};
