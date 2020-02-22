const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSwitch = {
  value: 'c2c-switch',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.BINARY],
  },
};

module.exports = { c2cSwitch };
