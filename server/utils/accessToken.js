const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_VALIDITY = 24 * 60 * 60; // access token is valid 24 hour

/**
 * @private
 * @description Generate an access token token.
 * @param {string} userId - The UserId.
 * @param {Array} scope - The scope.
 * @param {string} sessionId - The session ID.
 * @param {string} jwtSecret - JWT secret.
 * @param {number} [validityInSeconds] - Lifetime of the token, at most the default 24 hours.
 * @example
 * const accessToken = generateAccessToken(
 *  '31a4d8d9-bf39-49be-8588-dac2b8cfa74a',
 *  ['dashboard:write', 'dashboard:read'],
 *  '2a2ccdbd-88ff-42a6-a7de-b98cb0cb3b20',
 *  'secret'
 * );
 * @returns {string} Return accessToken.
 */
function generateAccessToken(userId, scope, sessionId, jwtSecret, validityInSeconds = ACCESS_TOKEN_VALIDITY) {
  return jwt.sign({ user_id: userId, scope, session_id: sessionId }, jwtSecret, {
    algorithm: 'HS256',
    audience: 'user',
    issuer: 'gladys',
    expiresIn: Math.min(validityInSeconds, ACCESS_TOKEN_VALIDITY),
  });
}

module.exports = {
  generateAccessToken,
  ACCESS_TOKEN_VALIDITY,
};
