const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Gladys feature
  generateFeature: (channel = 0) => {
    return {
      name: 'Humidity',
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
    };
  },
};
