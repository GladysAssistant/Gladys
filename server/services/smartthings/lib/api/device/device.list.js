const { call } = require('../call');
/**
 * @description Get all devices.
 * @param {string} token - OAuth bearer token.
 * @returns {Object[]} All devices.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/getDevices
 * @example
 * list('my-bearer-token')
 */
async function list(token) {
  return call('/devices', token);
}

module.exports = {
  list,
};
