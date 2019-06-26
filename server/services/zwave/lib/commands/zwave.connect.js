const logger = require('../../../../utils/logger');

/**
 * @description Connect to Zwave USB driver
 * @param {string} driverPath - Path to the USB driver.
 * @example
 * zwave.connect(driverPath);
 */
function connect(driverPath) {
  logger.debug(`Zwave : Connecting to USB = ${driverPath}`);
  this.zwave.connect(driverPath);
  this.connected = true;
}

module.exports = {
  connect,
};
