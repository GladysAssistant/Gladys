const db = require('../../models');

/**
 * @description Save token.
 * @param {Object} authorizationCode - The authorization code.
 * @param {Object} client - The OAuth client.
 * @param {Object} user - The user.
 * @example
 * oauth.saveAuthorizationCode(
 * {
 *  code: 'fehzfo',
 *  scope: 'password',
 *  expires_at: new Date(),
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
  newAuthorizationCode.client_id = client.client_id;
  newAuthorizationCode.user_id = user.id;

  return db.OAuthAuthorizationCode.create(newAuthorizationCode);
}

module.exports = {
  saveAuthorizationCode,
};
