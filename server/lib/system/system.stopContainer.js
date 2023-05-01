const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Stop a container.
 * @param {string} containerId - Container id.
 * @returns {Promise<object>} The state of the command.
 * @example
 * const state = await stopContainer(containerId);
 */
async function stopContainer(containerId) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerId);
  return container.stop();
}

module.exports = {
  stopContainer,
};
