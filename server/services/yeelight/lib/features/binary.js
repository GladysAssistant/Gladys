const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: (name) => {
    return {
      name: `${name} On/Off`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
    };
  },
};
