const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getFeature } = require('./features');

const getModel = () => {
  return 'sonoff-t1-1ch';
};

const getLabel = () => {
  return 'Sonoff T1 1Ch';
};

const getFeatures = (externalId) => {
  return [getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch`, externalId)];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
