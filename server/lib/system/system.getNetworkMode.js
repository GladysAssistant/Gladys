const get = require('get-value');
const { PlatformNotCompatible } = require('../../utils/coreErrors');

// Gladys runs as a plain host process talking to the Docker socket (no
// container of its own), e.g. `npm start` on a Mac/Linux host with Docker
// available. This is a valid topology for external integrations.
const NETWORK_MODE_HOST_PROCESS = 'host-process';

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
    let containerId;
    try {
      containerId = await this.getGladysContainerId();
    } catch (e) {
      // Gladys is not containerized but can reach a Docker daemon: host
      // process mode. Integrations still run in their own containers.
      if (e instanceof PlatformNotCompatible) {
        this.networkMode = NETWORK_MODE_HOST_PROCESS;
        return this.networkMode;
      }
      throw e;
    }
    const gladysContainer = this.dockerode.getContainer(containerId);
    const gladysContainerInspect = await gladysContainer.inspect();
    this.networkMode = get(gladysContainerInspect, 'HostConfig.NetworkMode', { default: 'unknown' });
  }

  return this.networkMode;
}

module.exports = {
  getNetworkMode,
  NETWORK_MODE_HOST_PROCESS,
};
