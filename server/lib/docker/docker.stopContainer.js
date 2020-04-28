const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Stop a container.
 * @returns Container object.
 * @param containerName - Container name.
 * @example
 * const container = await stopContainer(containerName);
 */
async function stopContainer(containerName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerName).stop();

  logger.info(`container ${containerName} stopped`);

  return container;
}

module.exports = {
  stopContainer,
};
