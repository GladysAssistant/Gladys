const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSwitchPowerEnergy = {
  value: 'c2c-switch-power-energy',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [
      DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      DEVICE_FEATURE_TYPES.SWITCH.POWER,
      DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
    ],
  },
};

module.exports = { c2cSwitchPowerEnergy };
