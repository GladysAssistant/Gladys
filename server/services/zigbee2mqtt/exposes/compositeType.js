const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

module.exports = {
  type: 'composite',
  names: {
    color_xy: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        min: 0,
        max: 16777215,
      },
    },
  },
};
