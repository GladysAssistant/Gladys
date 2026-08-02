const logger = require('../../utils/logger');
const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Check if the Docker host kernel supports the CPU CFS scheduler.
 * Some kernels (Synology DSM among others) are compiled without CFS bandwidth
 * control: setting NanoCpus there makes the daemon reject container creation
 * with "NanoCPUs can not be set" (HTTP 400).
 * @returns {Promise<boolean>} Resolve with true if CPU limits can be set.
 * @example
 * const cpuCfsSupported = await this.hasCpuCfsSupport();
 */
async function hasCpuCfsSupport() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  if (this.cpuCfsSupport === null) {
    try {
      const dockerInfo = await this.dockerode.info();
      // only an explicit false means unsupported: on any doubt keep the
      // CPU limit, the kernels concerned always report the field
      this.cpuCfsSupport = dockerInfo.CPUCfsQuota !== false;
    } catch (e) {
      logger.warn(`hasCpuCfsSupport: unable to read Docker info, assuming CPU CFS support. ${e}`);
      return true;
    }
  }
  return this.cpuCfsSupport;
}

module.exports = {
  hasCpuCfsSupport,
};
