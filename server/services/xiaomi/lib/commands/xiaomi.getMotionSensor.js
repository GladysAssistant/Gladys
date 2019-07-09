const logger = require('../../../../utils/logger');

/**
 * @description Add node.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getMotionSensor(true);
 */
function getMotionSensor() {
  logger.debug(`Xiaomi : Geting sensor motion`);
  return this.motionSensor;
}

module.exports = {
  getMotionSensor,
};
