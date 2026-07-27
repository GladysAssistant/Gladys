const logger = require('../../utils/logger');
const { SUB_CONTAINER_ENV_VARIABLE } = require('./constants');

/**
 * @description (Re)create the container of a declared sub-container: the
 * previous container, if any, is destroyed (the /data volumes persist), the
 * private network is ensured and the runtime env is persisted so future
 * recreations keep the same environment.
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @param {object} [options] - Options.
 * @param {object} [options.env] - Runtime env, merged over the manifest env.
 * @returns {Promise<object>} Resolve with the created container.
 * @example
 * const container = await gladys.externalIntegration.createSubContainer(service, entry, { env });
 */
async function createSubContainer(service, entry, { env = {} } = {}) {
  const existing = await this.findSubContainer(service, entry.name);
  if (existing) {
    try {
      await this.system.removeContainer(existing.id, { force: true });
    } catch (e) {
      logger.warn(`Unable to remove previous container ${entry.name} of integration ${service.selector}`, e);
    }
  }
  await this.ensurePrivateNetwork(service);
  const descriptor = await this.buildSubContainerDescriptor(service, entry, { env });
  const container = await this.system.createContainer(descriptor);
  const storedEnvs = await this.getStoredSubContainerEnvs(service);
  storedEnvs[entry.name] = env;
  await this.variable.setValue(SUB_CONTAINER_ENV_VARIABLE, JSON.stringify(storedEnvs), service.id);
  return container;
}

module.exports = {
  createSubContainer,
};
