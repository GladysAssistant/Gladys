const logger = require('../../../../utils/logger');

/**
 * @description When the driver failed to start.
 * @example
 * zwave.on('driver failed', this.driverFailed);
 */
function driverFailed() {
  logger.debug(`Zwave : Failed to start driver.`);
  this.connected = false;
}

module.exports = {
  driverFailed,
};
