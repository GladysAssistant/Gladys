const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.[^.]+\.Humidity$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      name: 'Humidity',
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
