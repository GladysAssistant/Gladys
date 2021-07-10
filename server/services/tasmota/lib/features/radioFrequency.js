const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^StatusSNS\.RfReceived$/,
  // String state
  eventName: EVENTS.DEVICE.NEW_STRING_STATE,
  // Gladys feature
  generateFeature: () => {
    return {
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.SENSOR.PUSH,
      name: 'Radio Frequency',
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 1,
    };
  },
  generateExternalId: (key, fullKey) => {
    const parts = fullKey.split('.');
    return `${parts[1]}:RfReceived`;
  },
};
