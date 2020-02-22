const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cMotion2 = {
  value: 'c2c-motion-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.BINARY],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER],
  },
};

module.exports = { c2cMotion2 };
