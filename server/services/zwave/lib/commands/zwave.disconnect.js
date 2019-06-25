const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave usb driver.
 * @example
 * zwave.disconnect();
 */
function disconnect() {
  logger.debug(`Zwave : Disconnecting...`);
  this.zwave.disconnect();
  this.connected = false;
}

module.exports = {
  disconnect,
};
