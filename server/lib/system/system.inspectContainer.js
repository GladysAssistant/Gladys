const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return description of a container.
 * @param {string} containerId - Container id.
 * @param {object} options - Options for inspection (see https://docs.docker.com/engine/api/v1.37/#operation/ContainerInspect).
 * @returns {Promise} Resolve with container description.
 * @example
 * const containerDescription = await inspectContainer();
 */
async function inspectContainer(containerId, options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const container = this.dockerode.getContainer(containerId);
  const containerDescription = await container.inspect(options);
  return containerDescription;
}

module.exports = {
  inspectContainer,
};
