const db = require('../../models');
const { validateIntegrationToken } = require('../../utils/integrationToken');
const { SERVICE_TYPES } = require('../../utils/constants');

/**
 * @description Validate an integration JWT: signature + `integration`
 * audience (a user access token can never pass), service exists and is
 * external, and the token_version embedded in the token matches the current
 * one in DB (stateless revocation). Used by the host API middleware and by
 * the WebSocket authentication.
 * @param {string} token - The integration JWT.
 * @returns {Promise<object>} Resolve with the external integration service.
 * @example
 * const service = await gladys.externalIntegration.validateToken(token);
 */
async function validateToken(token) {
  const payload = validateIntegrationToken(token, this.jwtSecret);
  const service = await db.Service.findOne({
    where: {
      id: payload.service_id,
      type: SERVICE_TYPES.EXTERNAL,
    },
  });
  if (service === null) {
    throw new Error('EXTERNAL_INTEGRATION_NOT_FOUND');
  }
  if (service.token_version !== payload.token_version) {
    throw new Error('INTEGRATION_TOKEN_REVOKED');
  }
  return service.get({ plain: true });
}

module.exports = {
  validateToken,
};
