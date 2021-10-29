const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave usb driver.
 * @example
 * zwave.disconnect();
 */
async function disconnect() {
  if (this.connected) {
    logger.debug(`Zwave : Disconnecting...`);
    await this.driver.destroy();
  } else {
    logger.debug('Zwave: Not connected, disconnecting');
  }
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;

  this.updateConfigJob.cancel();
}

module.exports = {
  disconnect,
};
