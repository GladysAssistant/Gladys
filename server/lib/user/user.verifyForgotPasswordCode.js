const crypto = require('crypto');
const db = require('../../models');
const logger = require('../../utils/logger');
const { Error401 } = require('../../utils/httpErrors');
const { hashRefreshToken } = require('../../utils/refreshToken');
const { normalizeResetCode, RESET_TOKEN_VALIDITY_IN_SECONDS } = require('./user.forgotPassword');

const RESET_CODE_MAX_ATTEMPTS = 5;
const INVALID_CODE_MESSAGE = 'Invalid or expired code';

/**
 * @description Exchange the one-time code sent by forgotPassword for a short
 * lived reset-password session. A code is dropped once used, once expired, or
 * after too many wrong attempts; every failure answers the same 401 so the
 * response does not tell whether the account or a pending code exists.
 * @param {string} email - Email of the user.
 * @param {string} code - The code as typed by the user.
 * @param {string} useragent - Device linked to this session.
 * @returns {Promise<object>} Resolve with the access token to reset the password.
 * @example
 * const { access_token } = await gladys.user.verifyForgotPasswordCode('test@test.fr', 'ABCD-EFGH', 'chrome');
 */
async function verifyForgotPasswordCode(email, code, useragent) {
  const user = await db.User.findOne({
    attributes: ['id'],
    where: {
      email,
    },
  });
  if (user === null) {
    logger.info('Forgot password code received for an unknown email');
    throw new Error401(INVALID_CODE_MESSAGE);
  }

  const pendingCode = this.forgotPasswordCodes.get(user.id);
  if (pendingCode === undefined) {
    throw new Error401(INVALID_CODE_MESSAGE);
  }
  if (pendingCode.valid_until < new Date()) {
    this.forgotPasswordCodes.delete(user.id);
    throw new Error401(INVALID_CODE_MESSAGE);
  }

  pendingCode.attempts += 1;
  const typedHash = Buffer.from(hashRefreshToken(normalizeResetCode(code)));
  const expectedHash = Buffer.from(pendingCode.code_hash);
  const codeMatches = crypto.timingSafeEqual(typedHash, expectedHash);
  if (!codeMatches) {
    if (pendingCode.attempts >= RESET_CODE_MAX_ATTEMPTS) {
      logger.warn(`Forgot password: too many wrong codes for user ${user.id}, the code is dropped`);
      this.forgotPasswordCodes.delete(user.id);
    }
    throw new Error401(INVALID_CODE_MESSAGE);
  }

  // the code is one-time: drop it before handing out the session
  this.forgotPasswordCodes.delete(user.id);
  const scope = ['reset-password:write'];
  const session = await this.session.create(user.id, scope, RESET_TOKEN_VALIDITY_IN_SECONDS, useragent);
  return {
    access_token: session.access_token,
  };
}

module.exports = {
  verifyForgotPasswordCode,
  RESET_CODE_MAX_ATTEMPTS,
};
