const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSwitchPower = {
  value: 'c2c-switch-power',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.BINARY, DEVICE_FEATURE_TYPES.SWITCH.POWER],
  },
};

module.exports = { c2cSwitchPower };
