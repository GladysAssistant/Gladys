const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cDimmerPowerEnergy = {
  value: 'c2c-dimmer-power-energy',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [DEVICE_FEATURE_TYPES.LIGHT.BINARY, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS],
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.ENERGY, DEVICE_FEATURE_TYPES.SWITCH.POWER],
  },
};

module.exports = { c2cDimmerPowerEnergy };
