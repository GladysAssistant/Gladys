const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get Node-red configuration.
 * @returns {Promise} Current Node-red network configuration.
 * @example
 * const config = await nodeRed.getConfiguration();
 */
async function getConfiguration() {
  logger.debug('NodeRed: loading stored configuration...');

  // Load version parameters
  const dockerNodeRedVersion = await this.gladys.variable.getValue(CONFIGURATION.DOCKER_NODE_RED_VERSION, this.serviceId);
  // Gladys params
  const timezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);

  return {
    dockerNodeRedVersion,
    timezone,
  };
}

module.exports = {
  getConfiguration,
};
