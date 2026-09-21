const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/coreErrors');
const { parseOrigin } = require('../../utils/origin');
const { hashRefreshToken } = require('../../utils/refreshToken');

const RESET_TOKEN_VALIDITY_IN_SECONDS = 15 * 60; // 15 minutes
const RESET_CODE_VALIDITY_IN_SECONDS = 15 * 60; // 15 minutes
const RESET_CODE_LENGTH = 8;
// no 0/O, 1/I: the code is read on a phone and typed by hand
const RESET_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const FORGOT_PASSWORD_METHODS = {
  LINK: 'link',
  CODE: 'code',
};

/**
 * @description Generate a random one-time code, formatted "XXXX-XXXX".
 * @returns {string} The code.
 * @example
 * const code = generateResetCode();
 */
function generateResetCode() {
  let code = '';
  for (let i = 0; i < RESET_CODE_LENGTH; i += 1) {
    code += RESET_CODE_ALPHABET[crypto.randomInt(RESET_CODE_ALPHABET.length)];
  }
  return `${code.slice(0, RESET_CODE_LENGTH / 2)}-${code.slice(RESET_CODE_LENGTH / 2)}`;
}

/**
 * @description Bring a code typed by the user to the form it was generated
 * in: upper case, without the dash, spaces or anything else.
 * @param {string} code - The code as typed.
 * @returns {string} The normalized code.
 * @example
 * normalizeResetCode(' abcd-efgh '); // 'ABCDEFGH'
 */
function normalizeResetCode(code) {
  return String(code)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * @description Tell whether an origin is currently used by a live authenticated
 * session of this user, so a reset link may safely point to it. Only the
 * sessions of the user whose password is reset count: another account of the
 * instance must not be able to make an origin trusted for this one. Revoked
 * and expired sessions do not count either: a hostname used once must not stay
 * a valid link target forever, it may point somewhere else by now.
 * @param {string} userId - Id of the user whose password is reset.
 * @param {string} origin - The canonical origin.
 * @returns {Promise<boolean>} True when a live session of the user was opened from this origin.
 * @example
 * await isKnownOrigin('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'https://gladys.example.com');
 */
async function isKnownOrigin(userId, origin) {
  const count = await db.Session.count({
    where: {
      user_id: userId,
      origin,
      revoked: false,
      valid_until: {
        [Op.gt]: new Date(),
      },
    },
  });
  return count > 0;
}

/**
 * @description Start a password reset for a user. When the origin the request
 * comes from is used by a live authenticated session of this user, a reset
 * link pointing to that origin is generated. Otherwise, so a link can
 * never point to a host chosen by whoever filled the form, a short one-time
 * code is generated instead: the user types it on the instance he is on.
 * @param {string} email - Email of the user who forgot his password.
 * @param {string} useragent - Device linked to this session.
 * @param {string} [origin] - Origin the front is served from, as sent by the front.
 * @returns {Promise<object>} Resolve with the method ("link" or "code"), the
 * link or the code, and the user.
 * @example
 * const { method, link, code, user } = await gladys.user.forgotPassword('test@test.fr', 'chrome', 'http://localhost:1444');
 */
async function forgotPassword(email, useragent, origin = null) {
  // look  if the user exist
  const user = await db.User.findOne({
    where: {
      email,
    },
  });

  if (user === null) {
    const users = await db.User.findAll();
    const usersListString = users.map((oneUser) => oneUser.email).join(',');
    logger.info('Just received a forgot password requests but the user is not found');
    logger.info(`Here is the list of users in database: ${usersListString}`);
    throw new NotFoundError('User not found');
  }

  const userPlain = user.get({ plain: true });
  delete userPlain.password;
  const parsedOrigin = parseOrigin(origin);

  if (parsedOrigin !== null && (await isKnownOrigin(user.id, parsedOrigin))) {
    // generate a session token, without origin: this session is not an
    // authenticated one and must not make any origin trusted
    const scope = ['reset-password:write'];
    const session = await this.session.create(user.id, scope, RESET_TOKEN_VALIDITY_IN_SECONDS, useragent);
    return {
      method: FORGOT_PASSWORD_METHODS.LINK,
      link: `${parsedOrigin}/reset-password?token=${session.access_token}`,
      user: userPlain,
    };
  }

  logger.info(`Forgot password: origin "${origin}" is unknown to this instance, sending a one-time code instead`);
  const code = generateResetCode();
  // one pending code per user: a new request replaces the previous code
  this.forgotPasswordCodes.set(user.id, {
    code_hash: hashRefreshToken(normalizeResetCode(code)),
    valid_until: new Date(Date.now() + RESET_CODE_VALIDITY_IN_SECONDS * 1000),
    attempts: 0,
  });
  return {
    method: FORGOT_PASSWORD_METHODS.CODE,
    code,
    user: userPlain,
  };
}

module.exports = {
  forgotPassword,
  normalizeResetCode,
  FORGOT_PASSWORD_METHODS,
  RESET_TOKEN_VALIDITY_IN_SECONDS,
};
