const { DEVICE_FEATURE_CATEGORIES } = require('../../../../server/utils/constants');

/**
 * @description Convert Gladys feature into Zigbee2mqtt category.
 * @param {Object} feature - Device feature.
 * @returns {string} Zigbee2mqtt category.
 * @example
 * convertCategory(feature);
 */
function convertCategory(feature) {
  let result;

  if (!feature.read_only) {
    result = 'state';
  } else {
    const { category } = feature;
    switch (category) {
      case DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR: {
        result = 'water_leak';
        break;
      }
      case DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR: {
        result = 'contact';
        break;
      }
      case DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR: {
        result = 'occupancy';
        break;
      }
      case DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR: {
        result = 'illuminance';
        break;
      }
      case DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR: {
        result = 'smoke';
        break;
      }
      case DEVICE_FEATURE_CATEGORIES.BUTTON: {
        result = 'click';
        break;
      }
      default: {
        const [split] = category.split('-');
        result = split;
      }
    }
  }

  return result;
}

module.exports = {
  convertCategory,
};
