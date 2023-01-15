/**
 * @description Delete client_id, secret_id, access_token of current oauth2 integration and all devices.
 * @param {string} userId - Gladys userId.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * withings.deleteVar(
 *  'withings',
 *  'fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  }
 * );
 */
async function deleteVar(userId) {
  return this.oauth2Client.deleteClient(this.serviceId, userId);
}

module.exports = {
  deleteVar,
};