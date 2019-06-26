const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Heal Zwave network
 * @example
 * zwave.healNetwork();
 */
function healNetwork() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.debug(`Zwave : Heal network.`);
  this.zwave.healNetwork();
}

module.exports = {
  healNetwork,
};
