const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return list of devices for this container.
 * @param {string} containerId - Id of the container.
 * @returns {Promise} Resolve with list of devices.
 * @example
 * const binds = await getContainerDevices('e24ae1745d91');
 */
async function getContainerDevices(containerId) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerId);
  if (!container) {
    return [];
  }
  const inspect = await container.inspect();
  if (!inspect) {
    return [];
  }
  return inspect.HostConfig.Devices || [];
}

module.exports = {
  getContainerDevices,
};
