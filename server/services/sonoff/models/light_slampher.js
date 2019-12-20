const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getModel = () => {
  return 'slampher';
};

const getLabel = () => {
  return 'Slampher';
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
  ];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
