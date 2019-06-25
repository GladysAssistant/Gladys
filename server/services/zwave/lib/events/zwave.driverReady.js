const logger = require('../../../../utils/logger');

/**
 * @description When the driver is ready.
 * @param {string} homeId - The homeId.
 * @example
 * zwave.on('driver ready', this.driverReady);
 */
function driverReady(homeId) {
  logger.debug(`Zwave : Driver is ready. homeId = ${homeId}`);
  this.scanInProgress = true;
}

module.exports = {
  driverReady,
};
