const asyncMiddleware = require('./asyncMiddleware');
const { Error401 } = require('../../utils/httpErrors');

/**
 * @description Authenticate an external integration on the host API with its
 * integration JWT. Delegates to externalIntegration.validateToken: signature
 * + the `integration` audience (a user access token can never pass), the
 * service exists and is external, and the token_version embedded in the
 * token matches the current one in DB (stateless revocation: every container
 * recreation increments it).
 * @param {object} gladys - Gladys object.
 * @returns {Function} Express middleware.
 * @example
 * externalIntegrationAuthMiddleware(gladys);
 */
module.exports = function ExternalIntegrationAuthMiddleware(gladys) {
  return asyncMiddleware(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error401('NO_INTEGRATION_TOKEN_FOUND');
    }
    const token = authHeader.substring(7, authHeader.length);
    let service;
    try {
      service = await gladys.externalIntegration.validateToken(token);
    } catch (e) {
      throw new Error401('INVALID_INTEGRATION_TOKEN');
    }
    req.externalIntegrationService = service;
    next();
  });
};
