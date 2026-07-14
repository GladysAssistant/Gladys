const asyncMiddleware = require('./asyncMiddleware');
const { Error401 } = require('../../utils/httpErrors');
const { validateIntegrationToken } = require('../../utils/integrationToken');
const { SERVICE_TYPES } = require('../../utils/constants');
const db = require('../../models');

/**
 * @description Authenticate an external integration on the host API with its
 * integration JWT. Checks the signature + the `integration` audience (a user
 * access token can never pass), that the service exists, is external, and
 * that the token_version embedded in the token matches the current one in DB
 * (stateless revocation: every container recreation increments it).
 * @param {object} gladys - Gladys object.
 * @returns {Function} Express middleware.
 * @example
 * externalIntegrationAuthMiddleware(gladys);
 */
module.exports = function ExternalIntegrationAuthMiddleware(gladys) {
  return asyncMiddleware(async (req, res, next) => {
    let payload;
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error401('NO_INTEGRATION_TOKEN_FOUND');
      }
      const token = authHeader.substring(7, authHeader.length);
      payload = validateIntegrationToken(token, gladys.externalIntegration.jwtSecret);
    } catch (e) {
      throw new Error401('INVALID_INTEGRATION_TOKEN');
    }
    const service = await db.Service.findOne({
      where: {
        id: payload.service_id,
        type: SERVICE_TYPES.EXTERNAL,
      },
    });
    if (service === null || service.token_version !== payload.token_version) {
      throw new Error401('INVALID_INTEGRATION_TOKEN');
    }
    req.externalIntegrationService = service.get({ plain: true });
    next();
  });
};
