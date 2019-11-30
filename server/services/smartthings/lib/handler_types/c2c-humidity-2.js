const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cHumidity2 = {
  value: 'c2c-humidity-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: [
      DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    ],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER],
  },
};

module.exports = { c2cHumidity2 };
