const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getFeature } = require('./features');

const getModel = () => {
  return 'slampher';
};

const getLabel = () => {
  return 'Slampher';
};

const getFeatures = (externalId) => {
  return [getFeature(DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY, `Switch`, externalId)];
};

module.exports = {
  getFeatures,
  getModel,
  getLabel,
};
