const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getFeature } = require('./features');

const getModel = () => {
  return 'arilux-lc01';
};

const getLabel = () => {
  return 'Arilux LC01';
};

const getFeatures = (externalId) => {
  return [
    getFeature(DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY, `Switch`, externalId),
    getFeature(DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, `Brightness`, externalId),
    getFeature(DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR, `Color`, externalId),
  ];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
