const { call } = require('../call');
/**
 * @description Create new location.
 * @param {Object} location - Location to create.
 * @param {string} token - OAuth bearer token.
 * @returns {Object} Created location.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createLocation
 * @example
 * create(location, 'my-bearer-token')
 */
async function create(location, token) {
  return call('/locations', token, 'POST', location);
}

module.exports = {
  create,
};
