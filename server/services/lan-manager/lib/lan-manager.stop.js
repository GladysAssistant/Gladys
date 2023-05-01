const logger = require('../../../utils/logger');

/**
 * @description Stop LAN manager.
 * @example
 * lanManager.stop();
 */
function stop() {
  this.scanning = false;

  if (this.scanner) {
    logger.info('LANManager stops scanning devices');
    this.scanner.stopTimer();
    if (this.scanner.scanResults) {
      this.scanner.cancelScan();
    }
    this.scanner.removeAllListeners();
  }

  this.scanner = null;
}

module.exports = {
  stop,
};
