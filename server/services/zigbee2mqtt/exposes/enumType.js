const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

module.exports = {
  type: 'enum',
  feature: {
    min: 0,
    max: 1,
  },
  names: {
    action: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      },
    },
    /*
    fan_mode: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.SPEED,
      },
    },
    state: {
        feature: {
          category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
          type: DEVICE_FEATURE_TYPES.CURTAIN.STATE,
          min: 0,
          max: 2,
        },
    }
    system_mode: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.MODE,
      },
    },
    */
  },
};
