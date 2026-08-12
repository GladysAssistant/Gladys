const logger = require('../../utils/logger');
const { validateIntegrationToken } = require('../../utils/integrationToken');

const TOKEN_ENV_PREFIX = 'GLADYS_INTEGRATION_TOKEN=';

/**
 * @description True when the integration JWT baked in the container env is
 * still accepted: valid signature with the current secret, right service
 * and current token_version. A container holding a stale token (JWT secret
 * changed before it was persisted, token rotated) can only loop on
 * "authentication refused": restarting it is pointless, it must be
 * recreated with a fresh token.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<boolean>} Resolve with true when the container token is still valid.
 * @example
 * const valid = await gladys.externalIntegration.verifyContainerToken(service);
 */
async function verifyContainerToken(service) {
  try {
    const containerDescription = await this.system.inspectContainer(service.container_id);
    const env = (containerDescription && containerDescription.Config && containerDescription.Config.Env) || [];
    const tokenEntry = env.find((entry) => entry.startsWith(TOKEN_ENV_PREFIX));
    if (!tokenEntry) {
      return false;
    }
    const payload = validateIntegrationToken(tokenEntry.slice(TOKEN_ENV_PREFIX.length), this.jwtSecret);
    return payload.service_id === service.id && payload.token_version === service.token_version;
  } catch (e) {
    // container gone, or invalid/stale token signature
    logger.debug(e);
    return false;
  }
}

module.exports = {
  verifyContainerToken,
};
