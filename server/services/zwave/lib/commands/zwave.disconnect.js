const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave usb driver.
 * @example
 * zwave.disconnect();
 */
function disconnect() {
  if (this.connected) {
    logger.debug(`Zwave : Disconnecting...`);
    this.driver.destroy();
  } else {
    logger.debug('Zwave: Not connected, disconnecting');
  }
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};
