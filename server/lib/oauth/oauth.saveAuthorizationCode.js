const db = require('../../models');

/**
 * @description Save token.
 * @param {string} authorizationCode - The authorization code.
 * @param {string} client - The OAuth client.
 * @param {string} user - The user.
 * @example
 * oauth.saveAuthorizationCode(
 * {
 *  code: 'fehzfo',
 *  scope: 'password',
 *  expiresAt: new Date(),
 *  redirect_uri: 'https://my-redirect.uri',
 * },
 * client: {
 *  client_id: 'my-client',
 * },
 * user: {
 *  id: 'random-uuid',
 * });
 */
async function saveAuthorizationCode(authorizationCode, client, user) {
  const newAuthorizationCode = Object.assign({}, authorizationCode);
  newAuthorizationCode.client = client;
  newAuthorizationCode.user = user;

  return db.OAuthAuthorizationCode.create(newAuthorizationCode);
}

module.exports = {
  saveAuthorizationCode,
};
