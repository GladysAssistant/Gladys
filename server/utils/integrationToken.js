const jwt = require('jsonwebtoken');

const INTEGRATION_TOKEN_AUDIENCE = 'integration';
const INTEGRATION_TOKEN_ISSUER = 'gladys';

/**
 * @description Generate a stateless integration token for an external integration.
 * No expiration claim on purpose: revocation is done by incrementing the
 * `token_version` column of the `t_service` row (see externalIntegrationAuthMiddleware).
 * @param {string} serviceId - The service ID of the external integration.
 * @param {number} tokenVersion - The current token version of the service.
 * @param {string} jwtSecret - JWT secret.
 * @returns {string} Return the integration token.
 * @example
 * const token = generateIntegrationToken('31a4d8d9-bf39-49be-8588-dac2b8cfa74a', 0, 'secret');
 */
function generateIntegrationToken(serviceId, tokenVersion, jwtSecret) {
  return jwt.sign({ service_id: serviceId, token_version: tokenVersion }, jwtSecret, {
    algorithm: 'HS256',
    audience: INTEGRATION_TOKEN_AUDIENCE,
    issuer: INTEGRATION_TOKEN_ISSUER,
  });
}

/**
 * @description Validate an integration token. A user access token can never pass
 * this validation as it has a different audience ('user').
 * @param {string} token - The integration token to validate.
 * @param {string} jwtSecret - JWT secret.
 * @returns {object} Return the decoded payload ({ service_id, token_version }).
 * @example
 * const payload = validateIntegrationToken(token, 'secret');
 */
function validateIntegrationToken(token, jwtSecret) {
  return jwt.verify(token, jwtSecret, {
    algorithms: ['HS256'],
    audience: INTEGRATION_TOKEN_AUDIENCE,
    issuer: INTEGRATION_TOKEN_ISSUER,
  });
}

module.exports = {
  generateIntegrationToken,
  validateIntegrationToken,
};
