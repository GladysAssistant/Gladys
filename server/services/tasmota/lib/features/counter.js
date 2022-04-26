const i18n = require('i18n');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.COUNTER\.C\d+$/,
  // Gladys feature
  generateFeature: (device, key) => {
    const position = key.replace(/C/i, '');
    const name = `${i18n.__('integrations.global.device.feature.counter')} ${position}`.trim();

    return {
      category: DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      name,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
    };
  },
};
