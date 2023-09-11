const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get Node-RED configuration.
 * @returns {Promise} Current Node-RED network configuration.
 * @example
 * const config = await nodeRed.getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Node-RED: loading stored configuration...');

  const nodeRedUsername = await this.gladys.variable.getValue(CONFIGURATION.NODE_RED_USERNAME, this.serviceId);
  const nodeRedPassword = await this.gladys.variable.getValue(CONFIGURATION.NODE_RED_PASSWORD, this.serviceId);

  // Load version parameters
  const dockerNodeRedVersion = await this.gladys.variable.getValue(
    CONFIGURATION.DOCKER_NODE_RED_VERSION,
    this.serviceId,
  );
  // Gladys params
  const timezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);

  return {
    nodeRedUsername,
    nodeRedPassword,
    dockerNodeRedVersion,
    timezone,
  };
}

module.exports = {
  getConfiguration,
};
