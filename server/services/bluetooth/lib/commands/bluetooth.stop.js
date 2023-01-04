const logger = require('../../../../utils/logger');

/**
 * @description Stop Bluetooth device, remove all listeners.
 * @example
 * bluetooth.stop();
 */
async function stop() {
  this.discoveredDevices = {};

  this.stopScanPresence();

  logger.debug(`Bluetooth: Stop discovering`);
  this.bluetooth.stopScanning();

  logger.debug(`Bluetooth: Removing all Bluetooth listeners`);
  this.bluetooth.removeAllListeners();

  logger.debug(`Bluetooth: Reset service status`);
  this.bluetooth = undefined;

  if (this.scanTimer) {
    clearTimeout(this.scanTimer);
  }

  this.scanTimer = undefined;
  this.scanCounter = 0;
}

module.exports = {
  stop,
};
