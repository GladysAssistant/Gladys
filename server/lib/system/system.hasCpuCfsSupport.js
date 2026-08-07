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
      // the JSON keys of the /info API are `CpuCfsQuota`/`CpuCfsPeriod`
      // (json struct tags in moby api/types, they differ from the Go field
      // names `CPUCfsQuota`/`CPUCfsPeriod`) — accept both casings to be
      // robust across daemon variants
      const cfsQuota = dockerInfo.CpuCfsQuota !== undefined ? dockerInfo.CpuCfsQuota : dockerInfo.CPUCfsQuota;
      const cfsPeriod = dockerInfo.CpuCfsPeriod !== undefined ? dockerInfo.CpuCfsPeriod : dockerInfo.CPUCfsPeriod;
      // only an explicit false means unsupported: on any doubt keep the
      // CPU limit — the daemon needs both the CFS period and quota to
      // apply NanoCpus
      this.cpuCfsSupport = cfsQuota !== false && cfsPeriod !== false;
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
