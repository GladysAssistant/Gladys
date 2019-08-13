const uuid = require('uuid');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const featureConverter = (tasmotaModule, deviceName, deviceTopic) => {
  const features = [];
  switch (tasmotaModule) {
    case 6: {
      features.push({
        id: uuid.v4(),
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
        name: `${deviceName}`,
        external_id: `${deviceTopic}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      });
      features.push({
        id: uuid.v4(),
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 10000,
        name: `${deviceName} - ${DEVICE_FEATURE_CATEGORIES.POWER}`,
        external_id: `${deviceTopic}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.POWER}`,
      });
      break;
    }
    case 1:
    case 8:
      features.push({
        id: uuid.v4(),
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
        name: `${deviceName}`,
        external_id: `${deviceTopic}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      });
      break;
    default:
  }
  return features;
};

module.exports = {
  featureConverter,
};
