const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getThSensor(true);
 */
function getThSensor() {
  logger.debug(`Xiaomi : Geting sensor Th`);
  return this.temperatureSensor;
}

module.exports = {
  getThSensor,
};
