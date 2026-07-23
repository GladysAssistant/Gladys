const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get Matterbridge configuration.
 * @returns {Promise} Current Matterbridge network configuration.
 * @example
 * const config = await matterbridge.getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Matterbridge: loading stored configuration...');

  const dockerMatterbridgeVersion = await this.gladys.variable.getValue(
    CONFIGURATION.DOCKER_MATTERBRIDGE_VERSION,
    this.serviceId,
  );
  // Load persisted container name (resolved once at init)
  const matterbridgeContainerName = await this.gladys.variable.getValue(
    CONFIGURATION.MATTERBRIDGE_CONTAINER_NAME,
    this.serviceId,
  );

  return {
    dockerMatterbridgeVersion,
    matterbridgeContainerName,
  };
}

module.exports = {
  getConfiguration,
};
