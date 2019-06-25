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
  const categories = Object.keys(CATEGORIES);
  while (!found && i < categories.length) {
    const category = CATEGORIES[categories[i]];
    const validComClass = category.COMMAND_CLASSES ? category.COMMAND_CLASSES.includes(value.class_id) : true;
    const validIndex = category.INDEXES ? category.INDEXES.includes(value.index) : true;
    found = validComClass && validIndex;
    if (found) {
      categoryFound = {
        category: categories[i],
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
