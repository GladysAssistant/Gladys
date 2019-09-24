const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getParams = () => {
  return [
    {
      name: 'model',
      value: 's26',
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
  ];
};

module.exports = {
  getFeatures,
  getParams,
};
