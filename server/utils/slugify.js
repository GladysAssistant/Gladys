const slug = require('limax');

/**
 * @description Transform a string to a valid slug (useful for selector)
 * @param {string} str - The string to transform.
 * @returns {string} Return the slug.
 * @example
 * slugify('Living room light');
 */
function slugify(str) {
  const slugOptions = {
    separator: '-', 
    replacement: '-', 
    maintainCase: false, 
    separateNumbers: false, 
    tone: false, 
  };
  const newString=slug(str, slugOptions);
  return newString;
}

module.exports = {
  slugify,
};
