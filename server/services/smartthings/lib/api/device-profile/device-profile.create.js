const { call } = require('../call');
/**
 * @description Create new device profile.
 * @param {Object} deviceProfile - Device profile to create.
 * @param {string} token - OAuth bearer token.
 * @returns {Object} Created device profile.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createDeviceProfile
 * @example
 * create(deviceProfile, 'my-bearer-token')
 */
async function create(deviceProfile, token) {
  return call('/deviceprofiles', token, 'POST', deviceProfile);
}

module.exports = {
  create,
};
