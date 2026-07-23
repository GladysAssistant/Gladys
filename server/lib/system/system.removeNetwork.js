const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Remove a Docker network by name (idempotent: a missing
 * network is not an error).
 * @param {string} networkName - Name of the network to remove.
 * @returns {Promise} Resolve when the network is removed.
 * @example
 * await removeNetwork('gladys-int-ext-dev-my-integration');
 */
async function removeNetwork(networkName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const networks = await this.dockerode.listNetworks({ filters: { name: [networkName] } });
  const existingNetwork = networks.find((network) => network.Name === networkName);
  if (!existingNetwork) {
    return;
  }
  await this.dockerode.getNetwork(existingNetwork.Id).remove();
}

module.exports = {
  removeNetwork,
};
