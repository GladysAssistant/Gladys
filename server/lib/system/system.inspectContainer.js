const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Return description of a container.
 * @param {object} container - Container to inspect.
 * @returns {Promise} Resolve with container description.
 * @example
 * const containerDescription = await inspectContainer();
 */
async function inspectContainer(container) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const containerDescription = await container.inspect();
  return containerDescription;
}

module.exports = {
  inspectContainer,
};
