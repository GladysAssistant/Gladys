const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cDimmerEnergy = {
  value: 'c2c-dimmer-energy',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [DEVICE_FEATURE_TYPES.LIGHT.BINARY, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS],
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.ENERGY],
  },
};

module.exports = { c2cDimmerEnergy };
