const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');

const nodeRedContainerDescriptor = require('../docker/gladys-node-red-container.json');

/**
 * @description Checks if version is the latest for this service, if not, it removes existing containers.
 * @param {object} config - Service configuration properties.
 * @example
 * await nodeRed.checkForContainerUpdates(config);
 */
async function checkForContainerUpdates(config) {
  logger.info('Node-RED: Checking for current installed versions and required updates...');

  // Check for NodeRed container version
  if (config.dockerNodeRedVersion !== DEFAULT.DOCKER_NODE_RED_VERSION) {
    logger.info(`Node-RED: update #${DEFAULT.DOCKER_NODE_RED_VERSION} of the container required...`);

    const containers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [nodeRedContainerDescriptor.name] },
    });

    if (containers.length !== 0) {
      logger.debug('Node-RED: Removing current installed Node-RED container...');
      // If container is present, we remove it
      // The init process will create it again
      const [container] = containers;
      await this.gladys.system.removeContainer(container.id, { force: true });
    }

    // Update to last version
    config.dockerNodeRedVersion = DEFAULT.DOCKER_NODE_RED_VERSION;
    logger.info(`Node-RED: update #${DEFAULT.DOCKER_NODE_RED_VERSION} of the container done`);
  }
}

module.exports = {
  checkForContainerUpdates,
};
