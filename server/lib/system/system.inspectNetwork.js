const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Inspect a Docker network.
 * @param {string} networkName - Name of the network to inspect.
 * @returns {Promise} Resolve with network details.
 * @example
 * const network = await inspectNetwork('gladys-integrations');
 */
async function inspectNetwork(networkName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const network = this.dockerode.getNetwork(networkName);
  return network.inspect();
}

module.exports = {
  inspectNetwork,
};
