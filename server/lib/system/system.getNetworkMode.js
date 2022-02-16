const get = require('get-value');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { exec } = require('../../utils/childProcess');
const logger = require('../../utils/logger');

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
    const cmdResult = await exec('head -1 /proc/self/cgroup | cut -d/ -f3');
    let [cleanResult];
    if (cmdResult.indexOf('docker') > -1) {
      cleanResult = cmdResult.split(/[-/.]+/)[1];
      logger.debug(`Cgroups V2 detected ${cleanResult}`);
    } else {
      cleanResult = cmdResult;
      logger.debug(`Cgroups V1 detected ${cleanResult}`);
    }

const [containerId] = cleanResult.split('\n');
    const gladysContainer = this.dockerode.getContainer(containerId);
    const gladysContainerInspect = await gladysContainer.inspect();
    this.networkMode = get(gladysContainerInspect, 'HostConfig.NetworkMode', { default: 'unknown' });
  }

  return this.networkMode;
}

module.exports = {
  getNetworkMode,
};
