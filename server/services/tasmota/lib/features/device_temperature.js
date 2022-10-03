const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.ESP32\.Temperature$/,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      name: 'Device temperature',
      read_only: true,
      has_feedback: false,
      min: -100,
      max: 200,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };
  },
  generateExternalId: (key, fullKey) => {
    const parts = fullKey.split('.').slice(1, -1);
    return `${parts.join(':')}:DeviceTemperature`;
  },
};
