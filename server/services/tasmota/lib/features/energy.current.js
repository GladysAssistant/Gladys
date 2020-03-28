const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.ENERGY\.Current$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
      name: 'Energy',
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.AMPERE,
    };
  },
  generateExternalId: (key) => {
    return `ENERGY:${key}`;
  },
};
