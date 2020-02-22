const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { hashRefreshToken } = require('../../utils/refreshToken');

/**
 * @description Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
 * @param {string} refreshToken - The refresh token to retrieve.
 * @returns {Promise} An Object representing the refresh token and associated data.
 * @example
 * oauth.getRefreshToken('1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM');
 */
async function getRefreshToken(refreshToken) {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const token = await db.Session.findOne({
    where: {
      token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
      token_hash: refreshTokenHash,
    },
  });

  if (token && token.client_id) {
    const user = await db.User.findOne({
      where: {
        id: token.user_id,
      },
    });

    const client = await db.OAuthClient.findOne({
      where: {
        id: token.client_id,
      },
    });

    return {
      refreshToken,
      refreshTokenExpiresAt: new Date(token.valid_until),
      scope: token.scope,
      client: client.get({ plain: true }),
      user: user.get({ plain: true }),
    };
  }
  return null;
}

module.exports = {
  getRefreshToken,
};
