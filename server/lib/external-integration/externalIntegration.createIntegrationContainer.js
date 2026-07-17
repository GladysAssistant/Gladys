const db = require('../../models');
const logger = require('../../utils/logger');
const { generateIntegrationToken } = require('../../utils/integrationToken');

/**
 * @description (Re)create the container of an external integration. The
 * previous container, if any, is destroyed; token_version is incremented and
 * a fresh integration JWT is injected in Env, which instantly invalidates
 * every previous token of this integration.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<object>} Resolve with the created container.
 * @example
 * const container = await gladys.externalIntegration.createIntegrationContainer(service);
 */
async function createIntegrationContainer(service) {
  if (service.container_id) {
    try {
      await this.system.removeContainer(service.container_id, { force: true });
    } catch (e) {
      logger.warn(`Unable to remove previous container of integration ${service.selector}`, e);
    }
  }
  const tokenVersion = service.token_version + 1;
  const integrationToken = generateIntegrationToken(service.id, tokenVersion, this.jwtSecret);
  const descriptor = await this.buildContainerDescriptor(service, integrationToken);
  const container = await this.system.createContainer(descriptor);
  // multi-container integration: the main container is connected to BOTH
  // networks (its private one + gladys-integrations); the sub-containers
  // never join gladys-integrations (no token, no host API access)
  if (this.getManifestContainers(service).length > 0) {
    const privateNetworkName = await this.ensurePrivateNetwork(service);
    await this.system.connectToNetwork(privateNetworkName, container.id);
  }
  await db.Service.update({ token_version: tokenVersion, container_id: container.id }, { where: { id: service.id } });
  return container;
}

module.exports = {
  createIntegrationContainer,
};
