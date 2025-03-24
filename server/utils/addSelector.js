const { slugify } = require('./slugify');

/**
 * @description Add a selector to a given object.
 * @param {object} item - Any object to add a selector to.
 * @example
 * addSelector({
 *  name: 'my object'
 * });
 */
function addSelector(item) {
  if (item.selector) {
    item.selector = slugify(item.selector);
  } else if (item.name) {
    item.selector = slugify(item.name);
  }
}

/**
 * @description Add a selector in the context of a beforeValidate sequelize hook.
 * @param {object} item - Any object to add a selector to.
 * @example
 * addSelectorBeforeValidateHook({
 *  name: 'my object'
 * });
 */
function addSelectorBeforeValidateHook(item) {
  // We only slugify the selector for creation, not update
  if (item.isNewRecord) {
    addSelector(item);
  }
}

module.exports = {
  addSelector,
  addSelectorBeforeValidateHook,
};
