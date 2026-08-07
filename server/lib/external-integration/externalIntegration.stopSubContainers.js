const Promise = require('bluebird');

const logger = require('../../utils/logger');

/**
 * @description Stop every existing sub-container of an integration (stop of
 * the whole integration: the main container stops first, then everything
 * else). The desired state is not touched: the next start resumes the same
 * containers.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise} Resolve when the sub-containers are stopped.
 * @example
 * await gladys.externalIntegration.stopSubContainers(service);
 */
async function stopSubContainers(service) {
  await Promise.each(this.getManifestContainers(service), async (entry) => {
    const container = await this.findSubContainer(service, entry.name);
    if (container) {
      try {
        await this.system.stopContainer(container.id);
      } catch (e) {
        logger.warn(`Unable to stop sub-container ${entry.name} of integration ${service.selector}`, e);
      }
    }
  });
}

module.exports = {
  stopSubContainers,
};
