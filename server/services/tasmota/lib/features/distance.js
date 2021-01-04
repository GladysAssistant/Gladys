const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^(StatusSNS|Gladys)\.(SR04|VL53L0X)\.Distance$/,
  // Gladys feature
  generateFeature: (device, key, value, fullKey) => {
    const keyParts = fullKey.split('.');
    const unit = keyParts[1] === 'VL53L0X' ? DEVICE_FEATURE_UNITS.MM : DEVICE_FEATURE_UNITS.CM;

    return {
      category: DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      name: 'Distance',
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      unit,
    };
  },
  generateExternalId: (key, fullKey) => {
    const keyParts = fullKey.split('.');
    return `${keyParts[1]}:Distance`;
  },
};
