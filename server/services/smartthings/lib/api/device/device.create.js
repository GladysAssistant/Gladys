const { call } = require('../call');
/**
 * @description Create new device.
 * @param {Object} device - Device to create.
 * @param {string} token - OAuth bearer token.
 * @returns {Object} Created device.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/installDevice
 * @example
 * create(device, 'my-bearer-token')
 */
async function create(device, token) {
  return call('/devices', token, 'POST', device);
}

module.exports = {
  create,
};
