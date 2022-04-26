const i18n = require('i18n');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^(StatusSTS|Gladys)\.Speed$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.EFFECT_SPEED,
      name: `${i18n.__('integrations.global.device.feature.effectSpeed')}`,
      read_only: false,
      has_feedback: true,
      min: 1,
      max: 40,
    };
  },
};
