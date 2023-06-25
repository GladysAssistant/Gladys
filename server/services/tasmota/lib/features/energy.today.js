const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.ENERGY\.Today$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
      name: 'Energy today',
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 999999,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
    };
  },
  generateExternalId: (key) => {
    return `ENERGY:${key}`;
  },
  // Gladys vs Tasmota transformers
  readValue: (value) => {
    return value;
  },
};
