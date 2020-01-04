const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getFeature } = require('./features');

const getModel = () => {
  return 'sonoff-4-channel';
};

const getLabel = () => {
  return 'Sonoff 4 Channel';
};

const getFeatures = (externalId) => {
  return [
    getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch 1`, externalId, 1),
    getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch 2`, externalId, 2),
    getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch 3`, externalId, 3),
    getFeature(DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY, `Switch 4`, externalId, 4),
  ];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
