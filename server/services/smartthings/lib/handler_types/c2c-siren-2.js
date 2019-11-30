const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSiren2 = {
  value: 'c2c-siren-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.BINARY],
  },
};

module.exports = { c2cSiren2 };
