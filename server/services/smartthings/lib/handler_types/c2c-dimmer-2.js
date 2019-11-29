const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cDimmer2 = {
  value: 'c2c-dimmer-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [DEVICE_FEATURE_TYPES.LIGHT.BINARY, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER],
  },
};

module.exports = { c2cDimmer2 };
