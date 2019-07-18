const { CATEGORIES, UNKNOWN_CATEGORY, UNKNOWN_TYPE } = require('../constants');

/**
 * @description Get a ZWave value and return a category in Gladys
 * @param {Object} value - Value object.
 * @returns {Object} Return the category in Gladys.
 * @example
 * const { category, type } = getCategory({
 *  class_id: 49,
 *  index: 1,
 * });
 */
function getCategory(value) {
  let found = false;
  let categoryFound = null;
  let i = 0;
  while (!found && i < CATEGORIES.length) {
    const category = CATEGORIES[i];
    const validComClass = category.COMMAND_CLASSES ? category.COMMAND_CLASSES.includes(value.class_id) : true;
    const validIndex = category.INDEXES ? category.INDEXES.includes(value.index) : true;
    const validProductId = category.PRODUCT_IDS ? category.PRODUCT_IDS.includes(value.productid) : true;
    const validProductType = category.PRODUCT_TYPES ? category.PRODUCT_TYPES.includes(value.producttype) : true;
    found = validComClass && validIndex && validProductId && validProductType;
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
