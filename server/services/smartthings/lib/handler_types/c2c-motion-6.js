const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cMotion6 = {
  value: 'c2c-motion-6',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.BINARY],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER],
    [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL],
    [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: [
      DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    ],
    [DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]: [
      DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    ],
  },
};

module.exports = { c2cMotion6 };
