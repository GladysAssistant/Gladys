const logger = require('../../../../utils/logger');
const { PRESENCE_STATUS } = require('../utils/bluetooth.constants');

/**
 * @description Init scanner presence.
 * @example
 * this.initPresenceScanner();
 */
function initPresenceScanner() {
  // Manages presence scanner
  const { status, frequency, timer } = this.presenceScanner;
  if (timer) {
    logger.info(`Bluetooth configuration: stopping presence scanner`);
    clearInterval(timer);
    this.presenceScanner.timer = undefined;
  }
  if (status === PRESENCE_STATUS.ENABLED && this.ready) {
    logger.info(`Bluetooth configuration: starting presence scanner`);
    this.scanPresence();
    this.presenceScanner.timer = setInterval(this.scanPresence.bind(this), frequency);
  }
}

module.exports = {
  initPresenceScanner,
};
