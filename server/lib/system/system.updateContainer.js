const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Update an existing container's resources (ex: restart policy) without recreating it.
 * @param {string} containerId - Container id.
 * @param {object} options - Update options (see https://docs.docker.com/engine/api/v1.37/#operation/ContainerUpdate).
 * @returns {Promise} Resolve with the update result.
 * @example
 * await updateContainer(containerId, { RestartPolicy: { Name: 'always' } });
 */
async function updateContainer(containerId, options) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const container = this.dockerode.getContainer(containerId);
  return container.update(options);
}

module.exports = {
  updateContainer,
};
