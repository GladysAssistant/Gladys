const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cButton2 = {
  value: 'c2c-button-2',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.BUTTON]: [DEVICE_FEATURE_TYPES.BUTTON.CLICK],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER, DEVICE_FEATURE_TYPES.SENSOR.DECIMAL],
  },
};

module.exports = { c2cButton2 };
