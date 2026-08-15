const logger = require('../../utils/logger');
const { PlatformNotCompatible } = require('../../utils/coreErrors');

const NANO_CPUS_ERROR_REGEX = /NanoCPUs can not be set/i;

/**
 * @description Check if an error is the Docker daemon rejecting a CPU limit
 * because the kernel has no CPU CFS scheduler (Synology DSM among others).
 * The daemon re-validates the stored HostConfig at every container start, so
 * this error can also strike existing containers after a NAS kernel update.
 * @param {Error} e - The error to check.
 * @returns {boolean} True if the error is the CPU CFS rejection.
 * @example
 * if (isNanoCpusError(e)) { ... }
 */
function isNanoCpusError(e) {
  if (!e) {
    return false;
  }
  const jsonMessage = (e.json && e.json.message) || '';
  return (
    e.statusCode === 400 && (NANO_CPUS_ERROR_REGEX.test(e.message || '') || NANO_CPUS_ERROR_REGEX.test(jsonMessage))
  );
}

/**
 * @description Pull an new container image.
 * @param {string} options - Options.
 * @returns {Promise} The created container.
 * @example
 * await createContainer(options);
 */
async function createContainer(options) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  let createdContainer;
  try {
    createdContainer = await this.dockerode.createContainer(options);
  } catch (e) {
    const hostConfig = options && options.HostConfig;
    // safety net behind hasCpuCfsSupport: some hosts pass the docker info
    // detection but still reject CPU limits — trust the daemon over the
    // detection, remember it and retry once without the CPU limit
    if (isNanoCpusError(e) && hostConfig && hostConfig.NanoCpus) {
      logger.warn(`createContainer: kernel without CPU CFS support, retrying without CPU limit. ${e.message}`);
      this.cpuCfsSupport = false;
      const { NanoCpus, ...hostConfigWithoutCpuLimit } = hostConfig;
      createdContainer = await this.dockerode.createContainer({ ...options, HostConfig: hostConfigWithoutCpuLimit });
    } else {
      throw e;
    }
  }
  const containers = await this.getContainers({ all: true, filters: { id: [createdContainer.id] } });
  return containers[0];
}

module.exports = {
  createContainer,
  isNanoCpusError,
};
