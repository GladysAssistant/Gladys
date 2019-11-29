const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cContact3 = {
  value: 'c2c-contact-3',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.BINARY],
    [DEVICE_FEATURE_CATEGORIES.BATTERY]: [DEVICE_FEATURE_TYPES.SENSOR.INTEGER],
  },
};

module.exports = { c2cContact3 };
