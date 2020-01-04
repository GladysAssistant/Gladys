const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getFeature } = require('./features');

const getModel = () => {
  return 'sonoff-dual-r2';
};

const getLabel = () => {
  return 'Sonoff Dual R2';
};

const getFeatures = (externalId) => {
  return [
    getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch 1`, externalId, 1),
    getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch 2`, externalId, 2),
  ];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
