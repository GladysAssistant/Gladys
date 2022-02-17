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
    let containerId;
    containerId = await exec('cat /proc/self/cgroup | grep -o -e "docker/.*" | head -n 1 | sed -e "s!docker/!!g"');
    if (containerId) {
      logger.debug(`cgroupsv1 detected containerId ${containerId}`);
    } else {
      // eslint-disable-next-line no-useless-escape
      containerId = await exec(
        'cat /proc/self/cgroup | grep -o  -e "docker-.*.scope" | head -n 1 | sed "s/docker-(.*).scope/\\1/"',
      );
      logger.debug(`cgroupsv2 detected containerId ${containerId}`);
    }
    const gladysContainer = this.dockerode.getContainer(containerId);
    const gladysContainerInspect = await gladysContainer.inspect();
    this.networkMode = get(gladysContainerInspect, 'HostConfig.NetworkMode', { default: 'unknown' });
  }

  return this.networkMode;
}

module.exports = {
  getNetworkMode,
};
