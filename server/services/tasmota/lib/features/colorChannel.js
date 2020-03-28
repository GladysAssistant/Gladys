const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

module.exports = {
  // Tasmota matcher
  keyMatcher: /^(StatusSTS|Gladys)\.Channel$/,
  // Gladys feature
  generateFeature: (device, key, value) => {
    const channelSize = value.length;
    if (channelSize >= 3) {
      return {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        name: 'Color',
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 16777215,
      };
    }

    return null;
  },
  // Gladys vs Tasmota transformers
  readValue: (value) => {
    return value.slice(0, 3).reduce((acc, cur, i) => {
      return acc + ((cur * 255) / 100) * 256 ** (2 - i);
    }, 0);
  },
  writeValue: (value) => {
    const blue = value % 256;
    const green = ((value - blue) / 256) % 256;
    const red = ((value - green * 256 - blue) / 65536) % 256;

    return `${red},${green},${blue}`;
  },
};
