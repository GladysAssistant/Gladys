const { call } = require('../call');
/**
 * @description List all device profiles.
 * @param {string} token - OAuth bearer token.
 * @returns {Object[]} All device profiles.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/listDeviceProfiles
 * @example
 * list('my-bearer-token')
 */
async function list(token) {
  return call('/deviceprofiles', token);
}

module.exports = {
  list,
};
