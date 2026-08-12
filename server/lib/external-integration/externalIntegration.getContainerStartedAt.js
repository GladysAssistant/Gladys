const logger = require('../../utils/logger');

/**
 * @description Get the start date of the container of an integration
 * (Docker State.StartedAt), for the "running since..." display of the
 * supervision block. Best effort: an unreachable Docker or a removed
 * container simply returns null.
 * @param {object} service - The external integration service.
 * @returns {Promise<string>} Resolve with the ISO start date, or null.
 * @example
 * const startedAt = await gladys.externalIntegration.getContainerStartedAt(service);
 */
async function getContainerStartedAt(service) {
  if (!service.container_id || !this.available) {
    return null;
  }
  try {
    const container = await this.system.inspectContainer(service.container_id);
    return (container && container.State && container.State.StartedAt) || null;
  } catch (e) {
    logger.debug(e);
    return null;
  }
}

module.exports = {
  getContainerStartedAt,
};
