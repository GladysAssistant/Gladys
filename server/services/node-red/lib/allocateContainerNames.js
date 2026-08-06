const logger = require('../../../utils/logger');
const { resolveContainerName } = require('../../../utils/dockerContainers');
const { CONFIGURATION } = require('./constants');

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
    // Persist the resolved name immediately, before any container is created: a crash
    // between creation and saveConfiguration would otherwise orphan a suffixed container
    // (the retry would allocate a brand-new name instead of reusing this one).
    await this.gladys.variable.setValue(
      CONFIGURATION.NODE_RED_CONTAINER_NAME,
      config.nodeRedContainerName,
      this.serviceId,
    );
    logger.info(`Node-RED: using "${config.nodeRedContainerName}" as container name`);
  }
}

module.exports = {
  allocateContainerNames,
};
