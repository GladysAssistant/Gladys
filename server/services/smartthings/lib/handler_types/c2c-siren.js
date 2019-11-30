const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSiren = {
  value: 'c2c-siren',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.BINARY],
    [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.BINARY],
  },
};

module.exports = { c2cSiren };
