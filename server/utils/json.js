/**
 * @description Return a JSON parsed or the original string.
 * @param {any} str - Variable to parse.
 * @returns {any} Return a JSON parsed or the original string.
 * @example const res = parseJsonIfJson('{}');
 */
function parseJsonIfJson(str) {
  if (typeof str !== 'string') {
    return str;
  }
  try {
    const result = JSON.parse(str);
    const type = Object.prototype.toString.call(result);
    if (type === '[object Object]' || type === '[object Array]') {
      return result;
    }
    return str;
  } catch (err) {
    return str;
  }
}

module.exports = {
  parseJsonIfJson,
};
