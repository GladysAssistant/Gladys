const Promise = require('bluebird');

const logger = require('../../../../utils/logger');

const { TIMERS } = require('../device/bluetooth.information');

/**
 * @description Starts to Bluetooth device.
 * @returns {any} Null.
 * @example
 * bluetooth.start();
 */
function start() {
  logger.debug(`Bluetooth: Listening Bluetooth events`);

  this.bluetooth = require('@abandonware/noble');

  // Handle Bluetooth device change state
  this.bluetooth.on('stateChange', this.stateChange.bind(this));

  // Handle start / stop scanning
  this.bluetooth.on('scanStart', this.scanStart.bind(this));
  this.bluetooth.on('scanStop', this.scanStop.bind(this));

  // Handle new peripheral discovered
  this.bluetooth.on('discover', this.discover.bind(this));
  this.bluetooth.on('connect', (peripheral) => Promise.delay(TIMERS.CONNECTION).then(() => peripheral.disconnect()));

  this.connectDevices();

  return null;
}

module.exports = {
  start,
};
