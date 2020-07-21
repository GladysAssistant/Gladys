const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^(StatusSTS|Gladys)\.Scheme$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.EFFECT_MODE,
      name: 'Effect mode',
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 4,
    };
  },
};
