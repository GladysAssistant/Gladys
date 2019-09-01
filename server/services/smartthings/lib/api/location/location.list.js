const { call } = require('../call');
/**
 * @description List all locations.
 * @param {string} token - OAuth bearer token.
 * @returns {Object[]} All locations.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/listLocations
 * @example
 * list('my-bearer-token')
 */
async function list(token) {
  return call('/locations', token);
}

module.exports = {
  list,
};
