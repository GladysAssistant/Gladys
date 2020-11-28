const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { hashRefreshToken } = require('../../utils/refreshToken');

/**
 * @description Invoked to save an access token and optionally a refresh token, depending on the grant type.
 * @param {Object} token - The token(s) to be saved.
 * @param {Object} client - The client associated with the token(s).
 * @param {Object} user - The user associated with the token(s).
 * @returns {Promise} An Object representing the token(s) and associated data.
 * @example
 * oauth.saveToken(
 * {
 *  accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  accessTokenExpiresAt: new Date(),
 *  refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  refreshTokenExpiresAt: new Date(),
 *  scope: 'scope',
 * },
 * client: {
 *  id: 'my-client',
 * },
 * user: {
 *  id: 'user-uuid',
 * });
 */
async function saveToken(token, client, user) {
  const accessToken = {
    user_id: user.id,
    token_type: SESSION_TOKEN_TYPES.ACCESS_TOKEN,
    token_hash: hashRefreshToken(token.accessToken),
    scope: token.scope || 'dashboard:read',
    valid_until: token.accessTokenExpiresAt,
    client_id: client.id,
  };
  await db.Session.create(accessToken);

  const refreshToken = {
    user_id: user.id,
    token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
    token_hash: hashRefreshToken(token.refreshToken),
    scope: token.scope || 'dashboard:read',
    valid_until: token.refreshTokenExpiresAt,
    client_id: client.id,
  };
  await db.Session.create(refreshToken);

  return { ...token, user, client };
}

module.exports = {
  saveToken,
};
