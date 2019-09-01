const { call } = require('../call');

/**
 * @description Delete existing device.
 * @param {Object} device - The device to delete.
 * @param {string} token - OAuth bearer token.
 * @returns {Object} Empty object.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/deleteDevice
 * @example
 * destroy({ deviceId: 'deivce-id'}, 'my-bearer-token')
 */
async function destroy(device, token) {
  return call(`/devices/${device.deviceId}`, token, 'DELETE');
}

module.exports = {
  destroy,
};
