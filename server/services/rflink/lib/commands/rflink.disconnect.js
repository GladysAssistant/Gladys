const logger = require('../../../../utils/logger');

/**
 * @description Disconnect Rflink Gateway.
 * @example
 * rflink.disconnect();
 */
function disconnect() {
  if (this.path && this.connected) {
    logger.debug(`Rflink : Disconnecting...`);
    this.sendUsb.close();
  } else {
    logger.debug('Rflink: Not connected');
  }
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};
