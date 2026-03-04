const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Get logs of a Docker container.
 * @param {string} containerId - Container id.
 * @param {object} options - Options for logs (see https://docs.docker.com/engine/api/v1.37/#operation/ContainerLogs).
 * @returns {Promise} Resolve with log stream.
 * @example
 * const stream = await getContainerLogs('abc123');
 */
async function getContainerLogs(containerId, options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const container = this.dockerode.getContainer(containerId);
  return container.logs({ stdout: true, stderr: true, tail: 100, follow: false, ...options });
}

module.exports = {
  getContainerLogs,
};
