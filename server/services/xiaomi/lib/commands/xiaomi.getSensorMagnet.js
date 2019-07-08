const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getSensorMagnet(true);
 */
function getSensorMagnet() {
  logger.debug(`Xiaomi : Geting sensor magnet`);
  return this.sensorMagnet;
}

module.exports = {
  getSensorMagnet,
};
