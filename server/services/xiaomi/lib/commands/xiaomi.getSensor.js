const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getSensor(true);
 */
function getSensor() {
  logger.debug(`Xiaomi : Geting all sensor`);
  return this.sensor;
}

module.exports = {
  getSensor,
};
