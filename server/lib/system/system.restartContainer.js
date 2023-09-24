const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Execute a command in a container image.
 * @param {string} containerId - Container id.
 * @returns {Promise<object>} The state of the command.
 * @example
 * const state = await restartContainer(containerId);
 */
async function restartContainer(containerId) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerId);
  return container.restart();
}

module.exports = {
  restartContainer,
};
