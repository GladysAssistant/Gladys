const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { PRIVATE_NETWORK_PREFIX } = require('./constants');

/**
 * @description Remove every sub-container of an integration, and its
 * private network (uninstall). On update the network is kept: the new
 * containers are recreated on it from the new manifest at the next start.
 * @param {object} service - The external integration service (plain object).
 * @param {object} [options] - Options.
 * @param {boolean} [options.removeNetwork] - Also remove the private network.
 * @returns {Promise} Resolve when everything is removed.
 * @example
 * await gladys.externalIntegration.removeSubContainers(service);
 */
async function removeSubContainers(service, { removeNetwork = true } = {}) {
  await Promise.each(this.getManifestContainers(service), async (entry) => {
    const container = await this.findSubContainer(service, entry.name);
    if (container) {
      try {
        await this.system.removeContainer(container.id, { force: true });
      } catch (e) {
        logger.warn(`Unable to remove sub-container ${entry.name} of integration ${service.selector}`, e);
      }
    }
  });
  if (removeNetwork) {
    try {
      await this.system.removeNetwork(`${PRIVATE_NETWORK_PREFIX}${service.selector}`);
    } catch (e) {
      logger.warn(`Unable to remove private network of integration ${service.selector}`, e);
    }
  }
}

module.exports = {
  removeSubContainers,
};
