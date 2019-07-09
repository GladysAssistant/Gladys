const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getTemperatureSensor(true);
 */
function getTemperatureSensor() {
  logger.debug(`Xiaomi : Geting sensor Th`);
  return this.temperatureSensor;
}

module.exports = {
  getTemperatureSensor,
};
