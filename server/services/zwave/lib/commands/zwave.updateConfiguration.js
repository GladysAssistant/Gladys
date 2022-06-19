const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { CONFIGURATION } = require('../constants');

/**
 * @description Update Z-Wave configuration.
 * @example
 * zwave.updateConfiguration();
 */
async function updateConfiguration(configuration) {
  logger.debug(`Zwave : Updating configuration...`);

  const { zwaveMode, zwaveDriverPath } = configuration;

  await this.gladys.variable.setValue(CONFIGURATION.ZWAVEMODE, zwaveMode, this.serviceId);
  this.zwaveMode = zwaveMode;

  await this.gladys.variable.setValue(CONFIGURATION.ZWAVE_DRIVER_PATH, zwaveDriverPath, this.serviceId);
  this.zwaveDriverPath = zwaveDriverPath;

  this.restartRequired = true;
}

module.exports = {
  updateConfiguration,
};
