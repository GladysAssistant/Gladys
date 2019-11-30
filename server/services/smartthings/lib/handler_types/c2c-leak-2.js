const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cLeak2 = {
  value: 'c2c-leak-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.BINARY],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER],
  },
};

module.exports = { c2cLeak2 };
