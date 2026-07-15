const logger = require('../../../utils/logger');
const { resolveContainerName } = require('../../../utils/dockerContainers');

const containerDescriptor = require('../docker/gladys-matterbridge-container.json');

const IMAGE_MARKER = containerDescriptor.Image.split(':')[0];

/**
 * @description Resolve once, then persist, the name of the Matterbridge container owned by
 * the service. Existing healthy installs are adopted as-is thanks to the image proof;
 * only a real collision with a foreign container forces an alternative suffixed name.
 * @param {object} config - Service configuration properties (mutated in place).
 * @returns {Promise} Resolve when the container name is allocated.
 * @example
 * await matterbridge.allocateContainerNames(config);
 */
async function allocateContainerNames(config) {
  if (!config.matterbridgeContainerName) {
    config.matterbridgeContainerName = await resolveContainerName(
      this.gladys.system,
      containerDescriptor.name,
      IMAGE_MARKER,
      'Matterbridge',
    );
    logger.info(`Matterbridge: using "${config.matterbridgeContainerName}" as container name`);
  }
}

module.exports = {
  allocateContainerNames,
};
