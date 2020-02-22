const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cRgbColorBulb = {
  value: 'c2c-rgb-color-bulb',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.LIGHT]: [
      DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    ],
  },
};

module.exports = { c2cRgbColorBulb };
