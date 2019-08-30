const db = require('../../models');

/**
 * @description Save token.
 * @param {string} token - The access token.
 * @param {string} client - The OAuth client.
 * @param {string} user - The user.
 * @example
 * oauth.saveToken(
 * {
 *  accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  accessTokenExpiresOn: new Date(),
 *  refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  refreshTokenExpiresOn: new Date(),
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
  newToken.client = client;
  newToken.user = user;

  return db.OAuthAccessToken.create(newToken);
}

module.exports = {
  saveToken,
};
