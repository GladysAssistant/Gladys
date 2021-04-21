const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return list of mounts for this container.
 * @param {string} containerId - Id of the container.
 * @returns {Promise} Resolve with list of mounts.
 * @example
 * const binds = await getContainerMounts('e24ae1745d91');
 */
async function getContainerMounts(containerId) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const containers = await this.dockerode.listContainers({
    filters: { id: [containerId] },
  });
  const [container] = containers;
  if (!container) {
    return [];
  }
  return container.Mounts;
}

module.exports = {
  getContainerMounts,
};
