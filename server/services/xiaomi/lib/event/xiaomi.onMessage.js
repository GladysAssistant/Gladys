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
    case 'gateway':
      this.newValueGateway(message, data);
      break;
    case 'motion':
    case 'sensor_motion.aq2':
      this.newValueMotionSensor(message, data);
      break;
    case 'sensor_magnet.aq2':
    case 'magnet':
      this.newValueMagnetSensor(message, data);
      break;
    case 'sensor_ht':
    case 'weather.v1':
      this.newValueTemperatureSensor(message, data);
      break;
    case 'sensor_cube.aqgl01':
      this.newValueCube(message, data);
      break;
    case 'switch':
      this.newValueSwitch(message, data);
      break;
    case 'smoke':
      this.newValueSmoke(message, data);
      break;
    case 'vibration':
      this.newValueVibration(message, data);
      break;
    case 'sensor_wleak.aq1':
      this.newValueLeak(message, data);
      break;
    case 'plug':
      this.newValuePlug(message, data);
      break;
    case 'ctrl_neutral1':
      this.newValueSingleWiredSwitch(message, data);
      break;
    case 'ctrl_neutral2':
      this.newValueDuplexWiredSwitch(message, data);
      break;
    case 'ctrl_ln1.aq1':
    case 'ctrl_ln1':
      this.newValueSingleWiredSwitchNeutral(message, data);
      break;
    case 'ctrl_ln2.aq1':
    case 'ctrl_ln2':
      this.newValueDuplexWiredSwitchNeutral(message, data);
      break;
    case '86sw2':
      this.newValueDuplexWirelessSwitch(message, data);
      break;
    default:
      logger.info(`Xiaomi device "${message.model}" not handled yet!`);
      break;
  }
}

module.exports = {
  onMessage,
};
