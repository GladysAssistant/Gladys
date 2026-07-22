const logger = require('../../../utils/logger');
const { resolveContainerName } = require('../../../utils/dockerContainers');
const { CONFIGURATION } = require('./constants');

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
    // Persist the resolved name immediately, before any container is created: a crash
    // between creation and saveConfiguration would otherwise orphan a suffixed container
    // (the retry would allocate a brand-new name instead of reusing this one).
    await this.gladys.variable.setValue(
      CONFIGURATION.MATTERBRIDGE_CONTAINER_NAME,
      config.matterbridgeContainerName,
      this.serviceId,
    );
    logger.info(`Matterbridge: using "${config.matterbridgeContainerName}" as container name`);
  }
}

module.exports = {
  allocateContainerNames,
};
