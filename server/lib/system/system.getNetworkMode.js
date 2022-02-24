const get = require('get-value');
const fs = require('fs');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { exec } = require('../../utils/childProcess');

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
    if (fs.existsSync(`/var/lib/gladysassistant/containerId`)) {
      this.containerId = fs.readFileSync('/var/lib/gladysassistant/containerId', 'utf8');
    } else {
      // eslint-disable-next-line no-useless-escape
      this.containerId = await exec(
        'cat /proc/self/cgroup | grep -o -e "docker.*" | head -n 1 | sed -e "s/.scope//g;s/docker-//g;s!docker/!!g"',
      );
    }
    const gladysContainer = this.dockerode.getContainer(this.containerId);
    const gladysContainerInspect = await gladysContainer.inspect();
    this.networkMode = get(gladysContainerInspect, 'HostConfig.NetworkMode', { default: 'unknown' });
  }

  return this.networkMode;
}

module.exports = {
  getNetworkMode,
};
