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
    return {
      code: created.code,
      expiresAt: new Date(created.expires_at),
      redirectUri: created.redirect_uri,
      scope: created.scope,
      client: created.client,
      user: created.user,
    };
  }

  return created;
}

module.exports = {
  getAuthorizationCode,
};
