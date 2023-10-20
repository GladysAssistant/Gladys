const jwt = require('jsonwebtoken');
const { Error401, Error403 } = require('../../utils/httpErrors');

/**
 * @description Validate an access token.
 * @param {string} accessToken - The access token to verify.
 * @param {string} scope - The scope required.
 * @returns {object} Return decoded access token.
 * @example
 * gladys.session.validateAccessToken('test', 'dashboard:write');
 */
function validateAccessToken(accessToken, scope) {
  /**
   * @type {object} decoded
   */
  const decoded = jwt.verify(accessToken, this.jwtSecret, {
    issuer: 'gladys',
    audience: 'user',
  });

  // we verify that the scope required to access this route is here
  if (decoded.scope.includes(scope) === false) {
    throw new Error401(`AuthMiddleware: Scope "${scope}" is not in list of authorized scope ${decoded.scope}`);
  }

  // we verify that the session is not revoked
  if (this.cache.get(`revoked_session:${decoded.session_id}`) === true) {
    throw new Error401('AuthMiddleware: Session was revoked');
  }

  // We verify that the session is not a tablet mode currently locked
  if (this.cache.get(`tablet_mode_locked:${decoded.session_id}`) === true) {
    // if the scope currently asked is the alarm scope, it's ok
    const scopeIsAlarmWrite = scope === 'alarm:write';
    if (!scopeIsAlarmWrite) {
      throw new Error403('TABLET_IS_LOCKED');
    }
  }

  return decoded;
}

module.exports = {
  validateAccessToken,
};
