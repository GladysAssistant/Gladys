const { InvalidTokenError } = require('oauth2-server');
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
  try {
    const payload = this.session.validateAccessToken(accessToken, 'dashboard:write');
    const tokenRaw = await db.Session.findOne({
      where: {
        id: payload.session_id,
      },
    });

    if (tokenRaw) {
      const token = tokenRaw.get({ plain: true });
      const user = await this.user.getById(payload.user_id);

      const client = await db.OAuthClient.findOne({
        where: {
          id: token.client_id,
          active: true,
        },
      });

      if (user && client) {
        return {
          accessToken,
          accessTokenExpiresAt: new Date(token.valid_until),
          scope: token.scope,
          client: client.get({ plain: true }),
          user,
        };
      }
    }
  } catch (e) {
    throw new InvalidTokenError(e);
  }
  return null;
}

module.exports = {
  getAccessToken,
};
