/**
 * @description Trim the input string.
 * @param {string} value - The value to trim.
 * @returns {string} The value without space character.
 * @example trimString('SunSpec      ')
 */
function trimString(value) {
  return value.replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, '');
}

module.exports = {
  trimString,
};
