const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

const featureConverter = (tasmotaModule) => {
  const features = [];
  switch (tasmotaModule) {
    case 6: {
      features.push({
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1
      });
      features.push({
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: Number.MAX_VALUE
      });
      break;
    }
    case 1:
    case 8:
      features.push({
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1
      });
      break;
  }
  return features;
};

module.exports = {
  featureConverter,
}