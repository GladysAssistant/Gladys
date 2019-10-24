const { DEVICE_FEATURE_CATEGORIES } = require('../../../../server/utils/constants');

/**
 * @description Convert Gladys category into Zigbee2mqtt category.
 * @param {string} category - Device category.
 * @returns {*} Zigbee2mqtt category.
 * @example
 * convertCategory('temperature-sensor');
 */
function convertCategory(category) {
  let result;

  switch (category) {
    case DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR: {
      result = 'water';
      break;
    }
    default: {
      const [split] = category.split('-');
      result = split;
    }
  }

  return result;
}

module.exports = {
  convertCategory,
};
