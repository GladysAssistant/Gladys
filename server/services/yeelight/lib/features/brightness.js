const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: (name) => {
    return {
      name: `${name} Brightness`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      read_only: false,
      has_feedback: false,
      min: 1,
      max: 100,
    };
  },
};