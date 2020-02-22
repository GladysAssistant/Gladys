const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cRgbwColorBulb = {
  value: 'c2c-rgbw-color-bulb',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [
      DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    ],
  },
};

module.exports = { c2cRgbwColorBulb };
