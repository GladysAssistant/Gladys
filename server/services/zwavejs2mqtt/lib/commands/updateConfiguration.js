const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../constants');

/**
 * @description Update Z-Wave configuration.
 * @param {Object} configuration - The configuration data.
 * @example
 * zwave.updateConfiguration({ zwaveDriverPath: '' });
 */
async function updateConfiguration(configuration) {
  logger.debug(`Zwave : Updating configuration...`);

  const { zwaveDriverPath } = configuration;

  await this.gladys.variable.setValue(CONFIGURATION.ZWAVE_DRIVER_PATH, zwaveDriverPath, this.serviceId);
  this.zwaveDriverPath = zwaveDriverPath;

  this.restartRequired = true;
}

module.exports = {
  updateConfiguration,
};
