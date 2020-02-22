const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cDimmer = {
  value: 'c2c-dimmer',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [DEVICE_FEATURE_TYPES.LIGHT.BINARY, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS],
  },
};

module.exports = { c2cDimmer };
