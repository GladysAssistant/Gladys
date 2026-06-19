const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { CONFIGURATION, NODE_RED_MAJOR_VERSIONS } = require('./constants');
const { resolveNodeRedMajorVersion } = require('./nodeRedVersion');

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

  const configuration = {
    nodeRedUsername,
    nodeRedPassword,
    dockerNodeRedVersion,
    timezone,
  };

  return {
    ...configuration,
    dockerNodeRedVersion: resolveNodeRedMajorVersion(configuration),
    availableMajorVersions: NODE_RED_MAJOR_VERSIONS,
  };
}

module.exports = {
  getConfiguration,
};
