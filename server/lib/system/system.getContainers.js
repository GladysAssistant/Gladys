const get = require('get-value');
const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return list of containers.
 * @param {object} [options] - List of filtering options.
 * @returns {Promise} Resolve with list of containers.
 * @example
 * const containers = await getContainers();
 */
async function getContainers(options = { all: true }) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const containers = await this.dockerode.listContainers(options);
  return containers.map((container) => {
    return {
      name: container.Names[0],
      image: container.Image,
      state: container.State,
      id: container.Id,
      networkMode: get(container, 'HostConfig.NetworkMode'),
      devices: get(container, 'HostConfig.Devices'),
      created_at: container.Created,
    };
  });
}

module.exports = {
  getContainers,
};
