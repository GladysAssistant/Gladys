const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Stop a container.
 * @returns {Promise} Container object.
 * @param containerName - Container name.
 * @example
 * const container = await stopContainer(containerName);
 */
async function stopContainer(containerName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerName).stop();

  return container;
}

module.exports = {
  stopContainer,
};
