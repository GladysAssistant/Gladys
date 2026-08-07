const logger = require('../../utils/logger');
const { SUB_CONTAINER_ENV_VARIABLE } = require('./constants');

/**
 * @description Get the runtime env of every sub-container, as provided by
 * the integration through POST /container/:name/start and persisted so a
 * recreation (crash recovery after a Gladys restart, hardware change) keeps
 * the same environment.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<object>} Resolve with { "<name>": { KEY: 'value' } }.
 * @example
 * const envs = await gladys.externalIntegration.getStoredSubContainerEnvs(service);
 */
async function getStoredSubContainerEnvs(service) {
  const rawEnvs = await this.variable.getValue(SUB_CONTAINER_ENV_VARIABLE, service.id);
  if (!rawEnvs) {
    return {};
  }
  try {
    return JSON.parse(rawEnvs);
  } catch (e) {
    logger.warn(`Invalid stored sub-container envs of integration ${service.selector}`, e);
    return {};
  }
}

module.exports = {
  getStoredSubContainerEnvs,
};
