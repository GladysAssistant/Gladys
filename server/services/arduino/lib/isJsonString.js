/**
 * @description Check if a string is parsable into JSON.
 * @param {string} str - The string to check.
 * @returns {boolean} - True if parsable.
 * @example
 * IsJsonString(str);
 */
function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

module.exports = {
  IsJsonString,
};
