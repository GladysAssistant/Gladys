const { CATEGORIES, UNKNOWN_CATEGORY, UNKNOWN_TYPE } = require('../constants');

/**
 * @description Get a ZWave value and return a category in Gladys
 * @param {Object} node - The node object.
 * @param {Object} value - Value object.
 * @returns {Object} Return the category in Gladys.
 * @example
 * const { category, type } = getCategory({
 *  productid: '',
 *  producttype: ''
 * }, {
 *  commandClass: 49,
 *  index: 1,
 *  fullProperty: 'currentValue',
 * });
 */
function getCategory(node, value) {
  let found = false;
  let categoryFound = null;
  let i = 0;

  // TODO
  if (value.property === 'currentValue') {
    return {
      category: UNKNOWN_CATEGORY,
      type: UNKNOWN_TYPE,
    };
  }

  while (!found && i < CATEGORIES.length) {
    const category = CATEGORIES[i];
    const validComClass = category.COMMAND_CLASSES ? category.COMMAND_CLASSES.includes(value.commandClass) : true;
    const validEndpoint = category.INDEXES ? category.INDEXES.includes(value.endpoint) : true;
    const validProperty = category.PROPERTIES ? category.PROPERTIES.includes(value.property) : true;
    const validProductId = category.PRODUCT_IDS ? category.PRODUCT_IDS.includes(node.productid) : true;
    const validProductType = category.PRODUCT_TYPES ? category.PRODUCT_TYPES.includes(node.producttype) : true;
    found = validComClass && validEndpoint && validProperty && validProductId && validProductType;
    if (found) {
      categoryFound = {
        category: category.CATEGORY,
        type: category.TYPE,
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
