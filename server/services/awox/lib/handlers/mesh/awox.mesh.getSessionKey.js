const { extractCredentials } = require('./awox.mesh.utils');

/**
 * @description Get device session key.
 * @param {Object} device - Device to get session key from..
 * @param {Object} peripheral - Peripheral to get session key from..
 * @returns {Promise<Buffer>} Resolve with session key.
 * @example
 * await getSessionKey({ external_id: 'bluetooth:0102030405'});
 */
async function getSessionKey(device, peripheral) {
  const { sessionKey } = peripheral;

  if (sessionKey) {
    return sessionKey;
  }

  // Check and extract credentials
  const credentials = extractCredentials(device);
  // Authenticate device
  const sessionKeyValue = await this.authenticate(peripheral, credentials);
  peripheral.sessionKey = sessionKeyValue;
  return sessionKeyValue;
}

module.exports = {
  getSessionKey,
};
