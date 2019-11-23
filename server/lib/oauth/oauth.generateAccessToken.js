const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { generateRefreshToken } = require('../../utils/refreshToken');
const { generateAccessToken } = require('../../utils/accessToken');

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
  const { refreshTokenHash } = await generateRefreshToken();

  const newSession = {
    user_id: user.id,
    token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
    token_hash: refreshTokenHash,
    scope,
    valid_until: new Date(Date.now() + LOGIN_SESSION_VALIDITY_IN_SECONDS * 1000),
    client_id: client.id,
  };

  const session = await db.Session.create(newSession);
  return generateAccessToken(user.id, scope, session.id, this.session.jwtSecret);
}

module.exports = {
  generateOAuthAccessToken,
};
