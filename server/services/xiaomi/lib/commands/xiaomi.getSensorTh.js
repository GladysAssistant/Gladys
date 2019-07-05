const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getSensorTh(true);
 */
function getSensorTh() {
  logger.debug(`Xiaomi : Geting sensor Th`);
  return this.sensorTh;
}

module.exports = {
  getSensorTh,
};
