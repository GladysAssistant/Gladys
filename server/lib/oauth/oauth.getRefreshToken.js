const db = require('../../models');

/**
 * @description Get the refresh token.
 * @param {string} bearerToken - The bearer token.
 * @returns {any} The token with refresh token.
 * @example
 * oauth.getRefreshToken('1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM');
 */
function getRefreshToken(bearerToken) {
  return db.OAuthAccessToken.findOne({
    where: {
      refresh_token: bearerToken,
    },
    include: {
      model: db.User,
      as: 'user',
    },
  });
}

module.exports = {
  getRefreshToken,
};
