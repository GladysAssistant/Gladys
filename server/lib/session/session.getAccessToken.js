const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { Error401 } = require('../../utils/httpErrors');
const { BadParameters } = require('../../utils/coreErrors');
const { hashRefreshToken } = require('../../utils/refreshToken');
const { generateAccessToken } = require('../../utils/accessToken');

/**
 * @description Create and save in database a refresh_token.
 * @param {string} refreshToken - The refresh token of the user.
 * @param {Array} scope - The scope to allow.
 * @returns {Promise} Resolving with the refreshToken.
 * @example
 * gladys.session.getAccessToken('xxxx');
 */
async function getAccessToken(refreshToken, scope) {
  if (!refreshToken || refreshToken.length === 0) {
    throw new BadParameters();
  }
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const session = await db.Session.findOne({
    where: {
      token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
      token_hash: refreshTokenHash,
    },
  });

  if (session === null) {
    throw new Error401(`Session not found`);
  }

  if (session.valid_until < new Date()) {
    throw new Error401(`Session has expired`);
  }

  if (session.revoked) {
    throw new Error401(`Session was revoked`);
  }

  if (session.tablet_mode_locked) {
    const scopeIsAlarmWrite = scope.length === 1 && scope[0] === 'alarm:write';
    if (!scopeIsAlarmWrite) {
      throw new Error401('TABLET_IS_LOCKED');
    }
  }

  const accessToken = generateAccessToken(session.user_id, scope, session.id, this.jwtSecret);

  return {
    access_token: accessToken,
  };
}

module.exports = {
  getAccessToken,
};
