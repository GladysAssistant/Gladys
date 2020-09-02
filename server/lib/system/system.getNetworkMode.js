const get = require('get-value');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const getConfig = require('../../utils/getConfig');

const config = getConfig();

/**
 * @description Get Gladys network into Docker environment.
 * @returns {Promise} Resolve with Docker network mode.
 * @example
 * const gladysNetworkMode = await this.getNetworkMode();
 */
async function getNetworkMode() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  if (!this.networkMode) {
    const containers = await this.dockerode.listContainers();
    const gladysContainer = containers.find((c) => c.Image.startsWith(config.dockerImage));
    this.networkMode = get(gladysContainer, 'HostConfig.NetworkMode', { default: 'unknown' });
  }

  return this.networkMode;
}

module.exports = {
  getNetworkMode,
};
