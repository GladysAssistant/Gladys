const { slugify } = require('./slugify');

/**
 * @description Generate a random number between min and max
 * @param {number} min - Minimum number (inclusive).
 * @param {number} max - Maximum number (exclusive).
 * @returns {number} Return an integer.
 * @example const random = getRandomInt(0, 10);
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * @description Generate a random string of a given length
 * @param {number} length - Length of the string.
 * @returns {string} Return a random string.
 * @example const random = getRandomArbitrary(0, 10);
 */
function getRandomStringOfNumbers(length) {
  let str = '';
  for (let i = 0; i < length; i += 1) {
    str += getRandomInt(0, 10);
  }
  return str;
}

/**
 * @description Add a selector to a given object.
 * @param {Object} item - Any object to add a selector to.
 * @example
 * addSelector({
 *  name: 'my object'
 * });
 */
function addSelector(item) {
  if (item.selector) {
    item.selector = slugify(`${item.selector}-${getRandomStringOfNumbers(4)}`);
  } else if (item.name) {
    item.selector = slugify(`${item.name}-${getRandomStringOfNumbers(4)}`);
  }
}

module.exports = {
  addSelector,
};
