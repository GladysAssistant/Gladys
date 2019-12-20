const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getModel = () => {
  return 'sonoff-sv';
};

const getLabel = () => {
  return 'Sonoff SV';
};

const getFeatures = () => {
  return [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
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
