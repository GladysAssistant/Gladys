const db = require('../../models');

/**
 * @description Invoked to retrieve an existing authorization code previously saved through saveAuthorizationCode().
 * @param {string} authorizationCode - The authorization code to retrieve.
 * @returns {Promise} An Object representing the authorization code and associated data.
 * @example
 * oauth.getAuthorizationCode('anyRandomAuthorizationCode');
 */
async function getAuthorizationCode(authorizationCode) {
  const where = {
    code: authorizationCode,
  };

  const created = await db.OAuthAuthorizationCode.findOne({
    where,
  });

  if (created) {
    const user = await this.user.getById(created.user_id);

    const client = await db.OAuthClient.findOne({
      where: {
        id: created.client_id,
      },
    });

    return {
      code: created.code,
      expiresAt: new Date(created.expires_at),
      redirectUri: created.redirect_uri,
      scope: created.scope,
      client: client.get({ plain: true }),
      user,
    };
  }

  return created;
}

module.exports = {
  getAuthorizationCode,
};
