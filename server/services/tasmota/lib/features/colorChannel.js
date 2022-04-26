const i18n = require('i18n');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { intToRgb, rgbToInt } = require('../../../../utils/colors');

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
        name: `${i18n.__('integrations.global.device.feature.color')}`,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 6579300,
      };
    }

    return null;
  },
  // Gladys vs Tasmota transformers
  readValue: (value) => {
    return rgbToInt(value.slice(0, 3));
  },
  writeValue: (value) => {
    const [red, green, blue] = intToRgb(value);
    return `${red},${green},${blue}`;
  },
};
