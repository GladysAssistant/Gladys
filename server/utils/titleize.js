/**
 * @description Converts first letter of each word to uppercase. (useful for name or title).
 * @param {string} str - The object/string to transform.
 * @returns {string} Return the titleized string.
 * @example
 * titleize("Living room LIGHT"); => "Living Room Light"
 */
function titleize(str) {
  const newStr = !str ? '' : str;

  return newStr.toLowerCase().replace(/(?:^|\s|-)\S/g, (c) => {
    return c.toUpperCase();
  });
}

module.exports = {
  titleize,
};
