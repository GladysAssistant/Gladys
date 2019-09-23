const logger = require('../../../../utils/logger');
/**
 * @description Xiaomi onMessage callback.
 * @param {Buffer} msg - The message buffer.
 * @param {string} rsinfo - Rs info.
 * @example
 * xiaomi.onMessage('{"model": "motion"}');
 */
async function onMessage(msg, rsinfo) {
  const message = JSON.parse(msg.toString());
  logger.debug(message);
  const data = message.data ? JSON.parse(message.data) : null;
  switch (message.model) {
    case 'motion':
    case 'sensor_motion.aq2':
      this.newValueMotionSensor(message, data);
      break;
    case 'sensor_magnet.aq2':
    case 'magnet':
      this.newValueMagnetSensor(message, data);
      break;
    case 'sensor_ht':
    case 'weather.v1': {
      this.newValueTemperatureSensor(message, data);
      break;
    }
    default:
      logger.info(`Xiaomi device "${message.model}" not handled yet!`);
      break;
  }
}

module.exports = {
  onMessage,
};
