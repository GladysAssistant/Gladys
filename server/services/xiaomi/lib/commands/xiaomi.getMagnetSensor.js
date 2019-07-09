const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getMagnetSensor(true);
 */
function getMagnetSensor() {
  logger.debug(`Xiaomi : Geting sensor magnet`);
  return this.magnetSensor;
}

module.exports = {
  getMagnetSensor,
};
