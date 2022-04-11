const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

module.exports = {
  type: 'enum',
  writeValue: (expose, value) => {
    return expose.values[value];
  },
  readValue: (expose, value) => {
    return expose.values.indexOf(value);
  },
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
  },
};
