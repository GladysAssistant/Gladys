const db = require('../../models');

/**
 * @description Get the refresh token.
 * @param {string} bearerToken - The bearer token.
 * @returns {any} The token with refresh token.
 * @example
 * oauth.getRefreshToken('1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM');
 */
async function getRefreshToken(bearerToken) {
  const refreshToken = await db.OAuthAccessToken.findOne({
    where: {
      refresh_token: bearerToken,
    },
    include: {
      model: db.User,
      as: 'user',
    },
  });

  if (refreshToken) {
    return refreshToken.get({ plain: true });
  }
  return refreshToken;
}

module.exports = {
  getRefreshToken,
};
