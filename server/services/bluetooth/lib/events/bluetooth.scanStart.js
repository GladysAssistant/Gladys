const logger = require('../../../../utils/logger');

/**
 * @description When the Bluetooth starts scanning.
 * @example
 * bluetooth.on('startScan', this.scanStart);
 */
function scanStart() {
  logger.debug(`Bluetooth: start scanning`);
  this.scanning = true;

  this.broadcastStatus();
}

module.exports = {
  scanStart,
};
