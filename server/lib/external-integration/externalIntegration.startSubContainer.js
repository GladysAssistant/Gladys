const { isNanoCpusError } = require('../system/system.createContainer');

/**
 * @description Start a declared sub-container: create it if it doesn't
 * exist yet, recreate it first when the provided runtime env differs from
 * the one of the existing container (destroy + create, the /data volumes
 * persist), then start it.
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @param {object} [options] - Options.
 * @param {object} [options.env] - Runtime env; undefined reuses the
 * persisted env of the previous start.
 * @returns {Promise<object>} Resolve with the started container.
 * @example
 * await gladys.externalIntegration.startSubContainer(service, entry, { env: { MQTT_PASSWORD: '...' } });
 */
async function startSubContainer(service, entry, { env } = {}) {
  const storedEnvs = await this.getStoredSubContainerEnvs(service);
  const storedEnv = storedEnvs[entry.name] || {};
  const effectiveEnv = env === undefined ? storedEnv : env;
  const envChanged = env !== undefined && JSON.stringify(storedEnv) !== JSON.stringify(env);
  let container = await this.findSubContainer(service, entry.name);
  if (!container || envChanged) {
    container = await this.createSubContainer(service, entry, { env: effectiveEnv });
  }
  try {
    await this.system.restartContainer(container.id);
  } catch (e) {
    // Docker re-validates the stored HostConfig at every start: a container
    // created with a CPU limit on a kernel that no longer supports CFS
    // (Synology DSM update) can never start again — recreate it without
    // the CPU limit
    if (!isNanoCpusError(e)) {
      throw e;
    }
    // the daemon just told us CPU limits are rejected: remember it so the
    // new descriptor directly omits NanoCpus, even when the docker info
    // detection misreports the support
    this.system.cpuCfsSupport = false;
    container = await this.createSubContainer(service, entry, { env: effectiveEnv });
    await this.system.restartContainer(container.id);
  }
  return container;
}

module.exports = {
  startSubContainer,
};
