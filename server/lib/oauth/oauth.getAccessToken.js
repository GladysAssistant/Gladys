const db = require('../../models');

/**
 * @description Get the access token.
 * @param {string} bearerToken - The bearer token.
 * @returns {any} The requested access token if found.
 * @example
 * oauth.getAccessToken('1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM');
 */
function getAccessToken(bearerToken) {
  return db.OAuthAccessToken.findOne({
    where: {
      access_token: bearerToken,
    },
    include: {
      model: db.User,
      as: 'user',
    },
  });
}

module.exports = {
  getAccessToken,
};
