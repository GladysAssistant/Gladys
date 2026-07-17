const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description List Docker networks, with optional filters.
 * @param {object} [options] - Dockerode listNetworks options (filters...).
 * @returns {Promise<Array>} Resolve with the list of networks.
 * @example
 * const networks = await getNetworks({ filters: { label: ['io.gladysassistant.external-integration'] } });
 */
async function getNetworks(options = {}) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  return this.dockerode.listNetworks(options);
}

module.exports = {
  getNetworks,
};
