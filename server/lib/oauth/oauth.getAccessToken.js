const db = require('../../models');

/**
 * @description Invoked to retrieve an existing access token previously saved through Model#saveToken().
 * This model function is required if OAuth2Server#authenticate() is used.
 * @param {string} accessToken - The access token to retrieve.
 * @returns {Promise} An Object representing the access token and associated data.
 * @example
 * oauth.getAccessToken('1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM');
 */
async function getAccessToken(accessToken) {
  const payload = this.session.validateAccessToken(accessToken, 'dashboard:write');
  const token = await db.Session.findOne({
    where: {
      id: payload.session_id,
    },
  });

  if (token) {
    const user = await this.user.getById(payload.user_id);

    let client;
    if (token.client_id) {
      client = await db.OAuthClient.findOne({
        where: {
          id: token.client_id,
        },
      });
      client = client.get({ plain: true });
    }

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
