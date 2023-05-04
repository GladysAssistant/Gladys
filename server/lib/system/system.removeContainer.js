const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Remove an Docker container.
 * @param {string} containerId - Container id.
 * @param {object} options - Options for removal (see https://docs.docker.com/engine/api/v1.37/#operation/ContainerDelete).
 * @returns {Promise} The removed container.
 * @example
 * await removeContainer(options);
 */
async function removeContainer(containerId, options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerId);
  return container.remove(options);
}

module.exports = {
  removeContainer,
};
