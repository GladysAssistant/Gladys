const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSwitchEnergy = {
  value: 'c2c-switch-energy',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.BINARY, DEVICE_FEATURE_TYPES.SWITCH.ENERGY],
  },
};

module.exports = { c2cSwitchEnergy };
