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

  return {
    dockerMatterbridgeVersion,
  };
}

module.exports = {
  getConfiguration,
};
