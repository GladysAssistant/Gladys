const logger = require('../../../utils/logger');
const { resolveContainerName } = require('../../../utils/dockerContainers');

const containerDescriptor = require('../docker/gladys-node-red-container.json');

const IMAGE_MARKER = containerDescriptor.Image.split(':')[0];

/**
 * @description Resolve once, then persist, the name of the Node-RED container owned by
 * the service. Existing healthy installs are adopted as-is thanks to the image proof;
 * only a real collision with a foreign container forces an alternative suffixed name.
 * @param {object} config - Service configuration properties (mutated in place).
 * @returns {Promise} Resolve when the container name is allocated.
 * @example
 * await nodeRed.allocateContainerNames(config);
 */
async function allocateContainerNames(config) {
  if (!config.nodeRedContainerName) {
    config.nodeRedContainerName = await resolveContainerName(
      this.gladys.system,
      containerDescriptor.name,
      IMAGE_MARKER,
      'Node-RED',
    );
    logger.info(`Node-RED: using "${config.nodeRedContainerName}" as container name`);
  }
}

module.exports = {
  allocateContainerNames,
};
