const db = require('../../models');

/**
 * @description Invoked to revoke an authorization code.
 * @param {Object} code - The return value.
 * @returns {Promise} Return true if the revocation was successful
 * or false if the authorization code could not be found.
 * @example
 * oauth.revokeAuthorizationCode(
 * {
 *  code: 'fehzfo',
 *  scope: 'password',
 *  expiresAt: new Date(),
 *  redirect_uri: 'https://my-redirect.uri',
 *  client: {
 *    id: 'my-client',
 *  },
 *  user: {
 *    id: 'user_id',
 *  }
 * });
 */
async function revokeAuthorizationCode(code) {
  const where = {
    code: code.code,
    user_id: code.user.id,
    client_id: code.client.id,
  };

  const created = await db.OAuthAuthorizationCode.findOne({
    where,
  });

  if (created) {
    await created.destroy();
    return true;
  }

  return false;
}

module.exports = {
  revokeAuthorizationCode,
};
