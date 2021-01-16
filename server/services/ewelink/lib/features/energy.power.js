const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: () => {
    return {
      name: 'Power',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit: DEVICE_FEATURE_UNITS.KILOWATT,
    };
  },
};
