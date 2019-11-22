const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cButton = {
  value: 'c2c-button',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.BUTTON]: [DEVICE_FEATURE_TYPES.BUTTON.CLICK],
  },
};

module.exports = { c2cButton };
