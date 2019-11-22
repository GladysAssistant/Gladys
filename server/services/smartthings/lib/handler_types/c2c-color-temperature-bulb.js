const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cColorTemperatureBulb = {
  value: 'c2c-color-temperature-bulb',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [
      DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    ],
  },
};

module.exports = { c2cColorTemperatureBulb };
