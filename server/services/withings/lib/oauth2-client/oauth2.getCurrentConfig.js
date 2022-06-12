const { OAUTH2 } = require('../../../../utils/constants');

/**
 * @description  Return the current integration config.
 * @param {string} serviceId - Gladys serviceId of current integration.
 * @param {string} userId - Gladys userId of current session.
 * @returns {Promise} The current integration config.
 * @example
 * oauth2.getCurrentConfig(
 *  serviceId: 'ffsdvs687f0bf3414e0fe3facfba7be945510fds09a'
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  }
 * );
 */
async function getCurrentConfig(serviceId, userId) {
  const resultClientId = await this.variable.getValue(OAUTH2.VARIABLE.CLIENT_ID, serviceId, userId);

  const resultAccessToken = await this.variable.getValue(OAUTH2.VARIABLE.ACCESS_TOKEN, serviceId, userId);

  // If access_token does not exist and client_id exist
  // => connect process is not complete: remove variable already saved
  // => force restart connect process from beginning
  if (resultClientId && !resultAccessToken) {
    await this.variable.destroy(OAUTH2.VARIABLE.CLIENT_ID, serviceId, userId);
    await this.variable.destroy(OAUTH2.VARIABLE.CLIENT_SECRET, serviceId, userId);
    return null;
  }

  return resultClientId;
}

module.exports = {
  getCurrentConfig,
};
