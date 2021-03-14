const Promise = require('bluebird');

const logger = require('../../../../utils/logger');

const { VARIABLES } = require('../utils/bluetooth.constants');

/**
 * @description Starts to Bluetooth device.
 * @returns {Promise} Null.
 * @example
 * await bluetooth.start();
 */
async function start() {
  logger.debug(`Bluetooth: Listening Bluetooth events`);

  this.bluetooth = require('@abandonware/noble');

  // Handle Bluetooth device change state
  this.bluetooth.on('stateChange', this.stateChange.bind(this));

  // Handle start / stop scanning
  this.bluetooth.on('scanStart', this.scanStart.bind(this));
  this.bluetooth.on('scanStop', this.scanStop.bind(this));

  // Handle new peripheral discovered
  this.bluetooth.on('discover', this.discover.bind(this));

  // Load configuration
  const scanPresenceStatus = await this.gladys.variable.getValue(VARIABLES.PRESENCE_STATUS, this.serviceId);
  if (scanPresenceStatus !== null) {
    this.presenceScanner.status = scanPresenceStatus;
  } else {
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_STATUS, this.presenceScanner.status, this.serviceId);
  }

  const scanFrequency = await this.gladys.variable.getValue(VARIABLES.PRESENCE_FREQUENCY, this.serviceId);
  if (scanFrequency !== null) {
    this.presenceScanner.frequency = scanFrequency;
  } else {
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_FREQUENCY, this.presenceScanner.frequency, this.serviceId);
  }

  this.initPresenceScanner();

  return null;
}

module.exports = {
  start,
};
