const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.(DHT11|AM2301)\.Temperature$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      name: 'Temperature',
      read_only: true,
      has_feedback: false,
      min: -100,
      max: 200,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };
  },
  generateExternalId: (key, fullKey) => {
    const parts = fullKey.split('.');
    return `${parts[1]}:Temperature`;
  },
};
