const { generateAccessToken } = require('../../utils/accessToken');

/**
 * @description Invoked to generate a new access token.
 * @param {*} client - The client the access token is generated for.
 * @param {*} user - The user the access token is generated for.
 * @param {*} scope - The scopes associated with the access token. Can be null.
 * @returns {string} The generated access token.
 * @example
 * gladys.oauth.generateOAuthAccessToken(
 * {
 *  id: 'client_id',
 *  secret: 'client_secret'
 * }, 'scope', {
 *  id: 'user_id'
 * })
 */
function generateOAuthAccessToken(client, user, scope) {
  return generateAccessToken(user.id, scope, client.id, client.secret);
}

module.exports = {
  generateOAuthAccessToken,
};
