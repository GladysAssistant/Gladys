const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getParams = () => {
  return [
    {
      name: 'model',
      value: 'basic',
    },
  ];
};

const getFeatures = (uuid, deviceName, deviceTopic) => {
  return [
    {
      id: uuid.v4(),
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
      name: `${deviceName}`,
      external_id: `sonoff:${deviceTopic}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
    },
    {
      id: uuid.v4(),
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 10000,
      name: `${deviceName} - ${DEVICE_FEATURE_TYPES.SWITCH.POWER}`,
      external_id: `sonoff:${deviceTopic}:${DEVICE_FEATURE_TYPES.SWITCH.POWER}`,
    },
  ];
};

module.exports = {
  getFeatures,
  getParams,
};
