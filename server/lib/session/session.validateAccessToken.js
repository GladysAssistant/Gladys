const jwt = require('jsonwebtoken');
const { Error401 } = require('../../utils/httpErrors');

/**
 * @description Validate an access token.
 * @param {string} accessToken - The access token to verify.
 * @param {string} scope - The scope required.
 * @example
 * gladys.session.validateAccessToken('test', 'dashboard:write');
 */
function validateAccessToken(accessToken, scope) {
  /**
   * @type {Object} decoded
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

  return decoded;
}

module.exports = {
  validateAccessToken,
};
