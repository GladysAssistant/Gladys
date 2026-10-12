const logger = require('../../../utils/logger');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { DEFAULT } = require('./constants');

const matterbridgeContainerDescriptor = require('../docker/gladys-matterbridge-container.json');

/**
 * @description Checks if version is the latest for this service, if not, it removes existing containers.
 * @param {object} config - Service configuration properties.
 * @example
 * await matterbridge.checkForContainerUpdates(config);
 */
async function checkForContainerUpdates(config) {
  logger.info('Matterbridge: Checking for current installed versions and required updates...');

  // Check for Matterbridge container version
  if (config.dockerMatterbridgeVersion !== DEFAULT.DOCKER_MATTERBRIDGE_VERSION) {
    logger.info(`Matterbridge: update #${DEFAULT.DOCKER_MATTERBRIDGE_VERSION} of the container required...`);

    // Only our own container is removed: a user container carrying the same name is left alone
    const container = await findManagedContainer(this.gladys.system, matterbridgeContainerDescriptor);

    if (container) {
      logger.debug('Matterbridge: Removing current installed Matterbridge container...');
      // If container is present, we remove it
      // The init process will create it again
      await this.gladys.system.removeContainer(container.id, { force: true });
    }

    // Update to last version
    config.dockerMatterbridgeVersion = DEFAULT.DOCKER_MATTERBRIDGE_VERSION;
    logger.info(`Matterbridge: update #${DEFAULT.DOCKER_MATTERBRIDGE_VERSION} of the container done`);
  }
}

module.exports = {
  checkForContainerUpdates,
};
