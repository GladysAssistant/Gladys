const i18n = require('i18n');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.(DHT11|AM2301)\.Humidity$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      name: `${i18n.__('integrations.global.device.feature.humidity')}`,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
    };
  },
  generateExternalId: (key, fullKey) => {
    const parts = fullKey.split('.');
    return `${parts[1]}:Humidity`;
  },
};
