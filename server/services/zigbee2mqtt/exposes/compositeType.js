const { intToRgb, xyToInt } = require('../../../utils/colors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

module.exports = {
  type: 'composite',
  writeValue: (expose, value) => {
    if (expose && expose.name === 'color_xy') {
      const [r, g, b] = intToRgb(parseInt(value, 10));
      return { rgb: `${r},${g},${b}` };
    }
    return value;
  },
  readValue: (expose, value) => {
    if (expose && expose.name === 'color_xy') {
      return xyToInt(value.x, value.y);
    }
    return value;
  },
  names: {
    color_xy: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        has_feedback: true,
        read_only: false,
        min: 0,
        max: 16777215,
      },
    },
  },
};
