const logger = require('../../../../utils/logger');

/**
 * @description Stop periodically scanner for device presence.
 * @example
 * this.stopScanPresence();
 */
function stopScanPresence() {
  const { timer } = this.presenceScanner;
  if (timer) {
    logger.info(`Bluetooth configuration: stopping presence scanner`);
    clearInterval(timer);
    this.presenceScanner.timer = undefined;
  }
}

module.exports = {
  stopScanPresence,
};
