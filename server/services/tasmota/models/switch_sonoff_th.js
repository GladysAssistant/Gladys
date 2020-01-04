const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getFeature } = require('./features');

const getModel = () => {
  return 'sonoff-th';
};

const getLabel = () => {
  return 'Sonoff TH';
};

const getFeatures = (externalId) => {
  return [getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch`, externalId)];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
