const logger = require('../../../../utils/logger');
const { BadParameters } = require('../../../../utils/coreErrors');
const { VARIABLES, PRESENCE_STATUS, TIMERS } = require('../utils/bluetooth.constants');

/**
 * @description Save Bluetooth configuration.
 * @param {object} configuration - Configuration to store.
 * @returns {Promise} - Always null.
 * @example
 * await this.saveConfiguration({ ... });
 */
async function saveConfiguration(configuration = {}) {
  const { presenceScanner = {} } = configuration;

  // Check and store presence scanner frequency
  if (presenceScanner.frequency !== undefined) {
    const minFrequency = TIMERS.SCAN * 2;
    if (presenceScanner.frequency <= minFrequency) {
      throw new BadParameters(`Bluetooth presence scan frequency should greater than ${minFrequency}`);
    }

    logger.debug(`Bluetooth configuration: presence scanner frequency set to ${presenceScanner.frequency}`);
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_FREQUENCY, presenceScanner.frequency, this.serviceId);
  }

  let newStatus = this.presenceScanner.status;
  // Check and store presence scanner status
  if (presenceScanner.status !== undefined) {
    newStatus = PRESENCE_STATUS.DISABLED;
    if (presenceScanner.status === PRESENCE_STATUS.ENABLED) {
      newStatus = PRESENCE_STATUS.ENABLED;
    }

    logger.debug(`Bluetooth configuration: presence scanner status set to ${newStatus}`);
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_STATUS, newStatus, this.serviceId);
  }

  // Store in memory
  this.presenceScanner = { ...this.presenceScanner, ...presenceScanner, status: newStatus };

  // Manages presence scanner
  this.initPresenceScanner();

  return this.getConfiguration();
}

module.exports = {
  saveConfiguration,
};
