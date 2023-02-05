const { VARIABLES } = require('./lan-manager.constants');

/**
 * @description Load LANManager configuration.
 * @example
 * await this.loadConfiguration();
 */
async function loadConfiguration() {
  // Load scanner status
  const scanPresenceStatus = await this.gladys.variable.getValue(VARIABLES.PRESENCE_STATUS, this.serviceId);
  if (scanPresenceStatus !== null) {
    this.presenceScanner.status = scanPresenceStatus;
  } else {
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_STATUS, this.presenceScanner.status, this.serviceId);
  }

  // Load scanner frequency
  const scanFrequency = await this.gladys.variable.getValue(VARIABLES.PRESENCE_FREQUENCY, this.serviceId);
  if (scanFrequency !== null) {
    this.presenceScanner.frequency = scanFrequency;
  } else {
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_FREQUENCY, this.presenceScanner.frequency, this.serviceId);
  }

  // Load scanner CIDRs
}

module.exports = {
  loadConfiguration,
};
