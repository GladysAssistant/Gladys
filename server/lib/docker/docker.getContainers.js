const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return list of containers.
 * @returns {Promise} Resolve with list of containers.
 * @example
 * const containers = await getContainers();
 */
async function getContainers() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const containers = await this.dockerode.listContainers({
    all: true,
  });
  return containers.map((container) => {
    return {
      name: container.Names[0],
      state: container.State,
      id: container.Id,
      created_at: container.Created,
    };
  });
}

module.exports = {
  getContainers,
};
