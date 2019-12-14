const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getModel = () => {
  return 'arilux-lc01';
};

const getFeatures = () => {
  return [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      read_only: false,
      has_feedback: true,
      min: 1,
      max: 100,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 16777215,
    },
  ];
};

module.exports = {
  getFeatures,
  getModel,
};
