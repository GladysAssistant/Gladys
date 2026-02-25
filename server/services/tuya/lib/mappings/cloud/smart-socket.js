const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../../utils/constants');

module.exports = {
  ignoredCodes: ['countdown', 'countdown_1'],
  switch: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  power: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
};
