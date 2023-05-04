const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { generateRefreshToken } = require('../../utils/refreshToken');
const { generateAccessToken } = require('../../utils/accessToken');

/**
 * @description Create and save in database a refresh_token.
 * @param {string} userId - The uuid of a user.
 * @param {Array} scope - Scope the refresh token is able to access.
 * @param {number} validityInSeconds - Validity of the refreshToken.
 * @param {string} useragent - Device linked to this session.
 * @returns {Promise} Resolving with the refreshToken.
 * @example
 * gladys.session.create('7144a75d-1ec2-4f31-a587-a4b316c28754', {});
 */
async function create(userId, scope, validityInSeconds, useragent) {
  const { refreshToken, refreshTokenHash } = await generateRefreshToken();

  const newSession = {
    user_id: userId,
    token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
    token_hash: refreshTokenHash,
    scope: scope.join(','),
    valid_until: new Date(Date.now() + validityInSeconds * 1000),
    useragent,
  };

  const session = await db.Session.create(newSession);
  const accessToken = generateAccessToken(userId, scope, session.id, this.jwtSecret);

  return {
    refresh_token: refreshToken,
    access_token: accessToken,
    session_id: session.id,
  };
}

module.exports = {
  create,
};
