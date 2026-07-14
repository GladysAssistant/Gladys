const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Create a Docker network if it doesn't exist yet (idempotent).
 * @param {string} networkName - Name of the network to create.
 * @param {object} [options] - Extra network creation options (IPAM, Options...).
 * @returns {Promise} Resolve when the network exists.
 * @example
 * await createNetwork('gladys-integrations', { Options: { 'com.docker.network.bridge.enable_icc': 'false' } });
 */
async function createNetwork(networkName, options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const networks = await this.dockerode.listNetworks({ filters: { name: [networkName] } });
  const existingNetwork = networks.find((network) => network.Name === networkName);
  if (existingNetwork) {
    return existingNetwork;
  }
  try {
    return await this.dockerode.createNetwork({ Name: networkName, Driver: 'bridge', ...options });
  } catch (e) {
    // The pinned subnet can already be taken on the machine: fall back
    // to Docker subnet auto-assignment (gateway is then read with inspectNetwork).
    if (options.IPAM) {
      logger.warn(`Unable to create network ${networkName} with pinned subnet, falling back to auto-assignment`, e);
      const { IPAM, ...optionsWithoutIpam } = options;
      return this.dockerode.createNetwork({ Name: networkName, Driver: 'bridge', ...optionsWithoutIpam });
    }
    throw e;
  }
}

module.exports = {
  createNetwork,
};
