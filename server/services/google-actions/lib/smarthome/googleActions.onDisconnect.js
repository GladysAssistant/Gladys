const { VARIABLES } = require('../../utils/constants');

/**
 * @description The function that will run for an DISCONNECT request.
 * It should return a valid response or a Promise that resolves to valid response.
 * @param {Object} body - Request body.
 * @param {Object} headers - Request headers.
 * @returns {Promise} A valid response.
 * @example
 * googleActions.onDisconnect({}, {});
 *
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#ondisconnect
 */
async function onDisconnect(body, headers) {
  const { user } = body;
  const refreshToken = headers.authentication.substring(7, headers.authentication.length);

  const token = {
    refreshToken,
    user,
    client: {
      id: 'google-actions',
    },
  };

  await this.gladys.oauth.revokeToken(token);

  delete this.userSmarthome[user.selector];

  // Clean all user variables
  return this.gladys.variable.destroy(VARIABLES.GOOGLEACTIONS_USER, this.serviceId, user.id);
}

module.exports = {
  onDisconnect,
};
