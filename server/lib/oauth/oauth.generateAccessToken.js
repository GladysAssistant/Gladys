const LOGIN_SESSION_VALIDITY_IN_SECONDS = 30 * 24 * 60 * 60;

/**
 * @description Invoked to generate a new access token.
 * @param {*} client - The client the access token is generated for.
 * @param {*} user - The user the access token is generated for.
 * @param {*} scope - The scopes associated with the access token. Can be null.
 * @returns {Promise} The generated access token.
 * @example
 * gladys.oauth.generateOAuthAccessToken(
 * {
 *  id: 'client_id',
 *  secret: 'client_secret'
 * }, 'scope', {
 *  id: 'user_id'
 * })
 */
async function generateOAuthAccessToken(client, user, scope) {
  const scopes = [scope || 'dashboard:write'];
  const session = await this.session.create(user.id, scopes, LOGIN_SESSION_VALIDITY_IN_SECONDS, null, client.id);
  return session.access_token;
}

module.exports = {
  generateOAuthAccessToken,
};
