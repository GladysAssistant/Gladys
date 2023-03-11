const logger = require('../../../utils/logger');
const { PRESENCE_STATUS } = require('./lan-manager.constants');

/**
 * @description Init scanner presence.
 * @example
 * this.initPresenceScanner();
 */
async function initPresenceScanner() {
  // Manages presence scanner
  const { status, frequency, timer } = this.presenceScanner;
  if (timer) {
    logger.info(`LANManager configuration: stopping presence scanner`);
    clearInterval(timer);
    this.presenceScanner.timer = undefined;
  }
  if (this.configured && status === PRESENCE_STATUS.ENABLED) {
    logger.info(`LANManager configuration: starting presence scanner`);
    await this.scanPresence();
    this.presenceScanner.timer = setInterval(this.scanPresence.bind(this), frequency);
  }
}

module.exports = {
  initPresenceScanner,
};
