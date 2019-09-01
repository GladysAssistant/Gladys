const db = require('../../models');

/**
 * @description Save token.
 * @param {Object} token - The access token.
 * @param {Object} client - The OAuth client.
 * @param {Object} user - The user.
 * @example
 * oauth.saveToken(
 * {
 *  access_token: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  access_token_expires_on: new Date(),
 *  refresh_token: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  refresh_token_expires_on: new Date(),
 * },
 * client: {
 *  client_id: 'my-client',
 * },
 * user: {
 *  id: 'random-uuid',
 * });
 */
async function saveToken(token, client, user) {
  const newToken = Object.assign({}, token);
  newToken.client_id = client.client_id;
  newToken.user_id = user.id;

  return db.OAuthAccessToken.create(newToken);
}

module.exports = {
  saveToken,
};
