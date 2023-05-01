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

module.exports = {
  addSelector,
};
