const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cSmoke2 = {
  value: 'c2c-smoke-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.BINARY],
  },
};

module.exports = { c2cSmoke2 };
