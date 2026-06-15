const logger = require('../../../utils/logger');

const nodeRedContainerDescriptor = require('../docker/gladys-node-red-container.json');
const { containerMatchesMajorVersion, resolveNodeRedMajorVersion } = require('./nodeRedVersion');

/**
 * @description Checks if the running container matches the selected Node-RED major version.
 * @param {object} config - Service configuration properties.
 * @example
 * await nodeRed.checkForContainerUpdates(config);
 */
async function checkForContainerUpdates(config = {}) {
  logger.info('Node-RED: Checking for current installed versions and required updates...');

  const selectedMajorVersion = resolveNodeRedMajorVersion(config);

  const containers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [nodeRedContainerDescriptor.name] },
  });

  if (containers.length === 0) {
    return;
  }

  const [container] = containers;

  if (containerMatchesMajorVersion(container.image, selectedMajorVersion)) {
    return;
  }

  logger.info(`Node-RED: update to major version #${selectedMajorVersion} of the container required...`);
  logger.debug('Node-RED: Removing current installed Node-RED container...');
  await this.gladys.system.removeContainer(container.id, { force: true });
  logger.info(`Node-RED: update to major version #${selectedMajorVersion} of the container done`);
}

module.exports = {
  checkForContainerUpdates,
};
