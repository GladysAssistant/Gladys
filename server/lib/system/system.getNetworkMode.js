const { PlatformNotCompatible } = require('../../utils/coreErrors');

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
    const containerId = await this.getGladysContainerId();
    const gladysContainer = this.dockerode.getContainer(containerId);
    const gladysContainerInspect = await gladysContainer.inspect();
    this.networkMode = gladysContainerInspect?.HostConfig?.NetworkMode ?? 'unknown';
  }

  return this.networkMode;
}

module.exports = {
  getNetworkMode,
};
