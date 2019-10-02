const db = require('../../models');

/**
 * @description Invoked to save an authorization code.
 * @param {Object} code - The code to be saved.
 * @param {Object} client - The client associated with the authorization code.
 * @param {Object} user - The user associated with the authorization code.
 * @returns {Promise} An Object representing the authorization code and associated data.
 * @example
 * oauth.saveAuthorizationCode(
 * {
 *  authorizationCode: 'fehzfo',
 *  scope: 'password',
 *  expiresAt: new Date(),
 *  redirectUri: 'https://my-redirect.uri',
 * },
 * client: {
 *  id: 'my-client',
 * },
 * user: {
 *  id: 'random-uuid',
 * });
 */
async function saveAuthorizationCode(code, client, user) {
  const newAuthorizationCode = {
    code: code.authorizationCode,
    scope: code.scope,
    expires_at: code.expiresAt,
    redirect_uri: code.redirectUri,
    client_id: client.id,
    user_id: user.id,
  };

  await db.OAuthAuthorizationCode.create(newAuthorizationCode);

  return { ...code, client, user };
}

module.exports = {
  saveAuthorizationCode,
};
