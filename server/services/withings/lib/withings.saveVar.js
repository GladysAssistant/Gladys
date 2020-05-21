const OAuth2Manager = require('../../../lib/oauth2');
/*
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_TYPES
 } = require('../../../utils/constants');
*/

/**
 * @description Build and save withings device with access_token response and init feature values.
 * @param {string} clientId - The client_id of oauth2.
 * @param {string} secretId - The secret_id of oauth2.
 * @param {string} integrationName - Name of oauth2 integration.
 * @param {string} userId - Gladys userId.
 * @returns {Promise} Resolve with withings service id.
 * @example
 * withings.saveVar(
 *  clientId: 'b2f2c27f0bf3414e0fe3facfba7be9455109409a',
 *  secretId: '9d41fe14fz23414e0fe3facfba7be9455109409a',
 *  integrationName: 'withings',
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  }
 * );
 */
async function saveVar(clientId, secretId, integrationName, userId) {
  const oauth2Manager = new OAuth2Manager(this.gladys);

  const oauth2SaveVarResult = await oauth2Manager.saveVar(clientId, secretId, integrationName, this.serviceId, userId);
  if (oauth2SaveVarResult.success) {
    return { success: true, serviceId: this.serviceId };
  }
  return { success: false, errorMsg: oauth2SaveVarResult.errorMsg };
}

module.exports = {
  saveVar,
};
