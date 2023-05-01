const logger = require('../../../utils/logger');
const { VARIABLES, PRESENCE_STATUS } = require('./lan-manager.constants');

/**
 * @description Save LANManager configuration.
 * @param {object} configuration - Configuration to store.
 * @returns {Promise} - New configuration.
 * @example
 * const config = await this.saveConfiguration({ ... });
 */
async function saveConfiguration(configuration = {}) {
  this.configured = false;
  const { presenceScanner = {}, ipMasks = [] } = configuration;

  // Check and store presence scanner frequency
  if (presenceScanner.frequency !== undefined) {
    logger.debug(`LANManager configuration: presence scanner frequency set to ${presenceScanner.frequency}`);
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_FREQUENCY, presenceScanner.frequency, this.serviceId);
  }

  let newStatus = this.presenceScanner.status;
  // Check and store presence scanner status
  if (presenceScanner.status !== undefined) {
    newStatus = PRESENCE_STATUS.DISABLED;
    if (presenceScanner.status === PRESENCE_STATUS.ENABLED) {
      newStatus = PRESENCE_STATUS.ENABLED;
    }

    logger.debug(`LANManager configuration: presence scanner status set to ${newStatus}`);
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_STATUS, newStatus, this.serviceId);
  }

  logger.debug('LANManager configuration: storing ip masks...');
  await this.gladys.variable.setValue(VARIABLES.IP_MASKS, JSON.stringify(ipMasks), this.serviceId);

  // Store in memory
  this.presenceScanner = { ...this.presenceScanner, ...presenceScanner, status: newStatus };
  this.ipMasks = ipMasks;
  this.configured = !!this.ipMasks.find((mask) => mask.enabled);

  // Manages presence scanner
  this.initPresenceScanner();

  return this.getConfiguration();
}

module.exports = {
  saveConfiguration,
};
