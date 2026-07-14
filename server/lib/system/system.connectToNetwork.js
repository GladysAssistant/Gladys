const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Connect a container to a Docker network (idempotent).
 * @param {string} networkName - Name of the network.
 * @param {string} containerId - Id of the container to connect.
 * @param {Array} [aliases] - Network aliases of the container on this network.
 * @returns {Promise} Resolve when the container is connected.
 * @example
 * await connectToNetwork('gladys-integrations', containerId, ['gladys']);
 */
async function connectToNetwork(networkName, containerId, aliases = []) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const network = this.dockerode.getNetwork(networkName);
  try {
    await network.connect({
      Container: containerId,
      EndpointConfig: {
        Aliases: aliases,
      },
    });
  } catch (e) {
    // Docker returns HTTP 403 when the container is already connected
    if (e.statusCode === 403) {
      logger.debug(`Container ${containerId} is already connected to network ${networkName}`);
      return;
    }
    throw e;
  }
}

module.exports = {
  connectToNetwork,
};
