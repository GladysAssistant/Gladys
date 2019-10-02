const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { hashRefreshToken } = require('../../utils/refreshToken');

/**
 * @description Invoked to retrieve an existing access token previously saved through Model#saveToken().
 * This model function is required if OAuth2Server#authenticate() is used.
 * @param {string} accessToken - The access token to retrieve.
 * @returns {Promise} An Object representing the access token and associated data.
 * @example
 * oauth.getAccessToken('1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM');
 */
async function getAccessToken(accessToken) {
  const accessTokenHash = hashRefreshToken(accessToken);
  const token = await db.Session.findOne({
    where: {
      token_type: SESSION_TOKEN_TYPES.ACCESS_TOKEN,
      token_hash: accessTokenHash,
    },
  });

  if (token && token.client_id) {
    const user = await db.User.findOne({
      where: {
        id: token.user_id,
      },
    }).get({ plain: true });

    const client = await db.OAuthClient.findOne({
      where: {
        id: token.client_id,
      },
    }).get({ plain: true });

    return {
      accessToken,
      accessTokenExpiresAt: new Date(token.valid_until),
      scope: token.scope,
      client,
      user,
    };
  }
  return null;
}

module.exports = {
  getAccessToken,
};
