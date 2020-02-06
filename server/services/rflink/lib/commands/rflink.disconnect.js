const logger = require('../../../../utils/logger');

/**
 * @description Disconnect Rflink Gateway.
 * @example
 * rflink.disconnect();
 */
function disconnect() {
  if (this.Path && this.connected) {
    logger.debug(`Rflink : Disconnecting...`);
  } else {
    logger.debug('Rflink: Not connected, disconnecting');
  }
  this.connected = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};