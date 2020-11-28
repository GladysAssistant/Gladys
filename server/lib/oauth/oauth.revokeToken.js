const db = require('../../models');
const { hashRefreshToken } = require('../../utils/refreshToken');

/**
 * @description Invoked to revoke a refresh token.
 * @param {Object} token - The token to be revoked.
 * @returns {Promise} Return true if the revocation was successful or false if the refresh token could not be found.
 * @example
 * oauth.revokeToken(
 * {
 *  refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
 *  refreshTokenExpiresAt: new Date(),
 *  client: {
 *    id: 'client_id',
 *  },
 *  user: {
 *    id: 'user_id',
 *  }
 * });
 */
async function revokeToken(token) {
  const tokenHash = hashRefreshToken(token.refreshToken);
  const session = await db.Session.findOne({
    attributes: ['id'],
    where: {
      token_hash: tokenHash,
      user_id: token.user.id,
      client_id: token.client.id,
    },
  });

  if (!session) {
    return false;
  }

  // revoke session in DB
  await session.update({ revoked: true });

  return true;
}

module.exports = {
  revokeToken,
};
