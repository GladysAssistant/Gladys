const OAuth2Manager = require('../../../lib/oauth2');

/**
 * @description Delete client_id, secret_id of current oauth2 integration and all devices.
 * @param {string} integrationName - Name of oauth2 integration.
 * @param {string} userId - Gladys userId.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * withings.deleteVar(
 *  integrationName: 'withings',
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  }
 * );
 */
async function deleteVar(integrationName, userId) {
  const oauth2Manager = new OAuth2Manager(this.gladys);
  const oauth2SaveVarResult = await oauth2Manager.deleteVar(integrationName, this.serviceId, userId);
  return oauth2SaveVarResult;
}

module.exports = {
  deleteVar,
};
