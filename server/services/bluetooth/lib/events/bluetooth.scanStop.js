const logger = require('../../../../utils/logger');

/**
 * @description When the Bluetooth stops scanning.
 * @example
 * bluetooth.on('startStop', this.scanStop);
 */
async function scanStop() {
  if (this.scanPromise && this.scanPromise.isPending()) {
    this.scanPromise.cancel();
  }
  this.scanCounter = 0;

  logger.debug(`Bluetooth: stop scanning`);

  this.scanning = false;
  this.broadcastStatus();
}

module.exports = {
  scanStop,
};
