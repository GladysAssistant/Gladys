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
  try {
    await container.stop();
  } catch (e) {
    // Docker returns HTTP 304 when the container is already stopped
    if (e.statusCode === 304) {
      return;
    }
    throw e;
  }
}

module.exports = {
  stopContainer,
};
