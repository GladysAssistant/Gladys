const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Pull an new container image.
 * @param {string} options - Options.
 * @returns {Promise} The created container.
 * @example
 * await createContainer(options);
 */
async function createContainer(options) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const createdContainer = await this.dockerode.createContainer(options);
  const containers = await this.getContainers({ all: true, filters: { id: [createdContainer.id] } });
  return containers[0];
}

module.exports = {
  createContainer,
};
