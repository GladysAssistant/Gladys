const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { CATEGORIES, UNKNOWN_CATEGORY, UNKNOWN_TYPE } = require('../constants');

/**
 * @description Get a ZWave value and return a category in Gladys
 * @param {Object} node - The node object.
 * @param {Object} value - Value object.
 * @returns {Object} Return the category in Gladys.
 * @example
 * const { category, type } = getCategory({
 *  product: '',
 *  type: ''
 * }, {
 *  commandClass: 49,
 *  endpoint: 1,
 *  fullProperty: 'currentValue',
 * });
 */
function getCategory(node, value) {
  let found = false;
  let categoryFound = null;
  let i = 0;

  while (!found && i < CATEGORIES.length) {
    const category = CATEGORIES[i];
    const validComClass = category.COMMAND_CLASSES ? category.COMMAND_CLASSES.includes(value.commandClass) : true;
    const validEndpoint = category.INDEXES ? category.INDEXES.includes(value.endpoint) : true;
    const validProperty = category.PROPERTIES ? category.PROPERTIES.includes(value.property) : true;
    const validProductId = category.PRODUCT_IDS ? category.PRODUCT_IDS.includes(node.product) : true;
    const validProductType = category.PRODUCT_TYPES ? category.PRODUCT_TYPES.includes(node.product) : true;
    found = validComClass && validEndpoint && validProperty && validProductId && validProductType;
    if (found) {
      categoryFound = {
        category: category.CATEGORY,
        type: category.TYPE,
        min: category.MIN,
        max: category.MAX,
        hasFeedback: true, // TODO
        should_poll: false,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      };
    }
    i += 1;
  }
  if (found) {
    return categoryFound;
  }

  return {
    category: UNKNOWN_CATEGORY,
    type: UNKNOWN_TYPE,
  };
}

module.exports = {
  getCategory,
};
