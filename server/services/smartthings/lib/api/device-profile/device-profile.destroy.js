const { call } = require('../call');
/**
 * @description Delete existing device profile.
 * @param {Object} deviceProfile - Device profile to delete.
 * @param {string} token - OAuth bearer token.
 * @returns {Object} Empty object.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/deleteDeviceProfile
 * @example
 * destroy(deviceProfile, 'my-bearer-token')
 */
async function destroy(deviceProfile, token) {
  return call(`/deviceprofiles/${deviceProfile.id}`, token, 'DELETE');
}

module.exports = {
  destroy,
};
