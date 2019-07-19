/**
 * @description Get Error
 * @param {Object} msg - Error.
 * @param {string} rsinfo - Error.
 * @example
 * onMessage('One Error');
 */
async function onMessage(msg, rsinfo) {
  const message = JSON.parse(msg.toString());
  // receive message from xiaomi
  switch (message.model) {
    case 'switch':
      break;
    case 'remote.b286acn01':
      break;
    case 'sensor_magnet.aq2':
      this.addMagnetSensor(message.sid);
      this.updateBooleanSensor(message.sid, message.data.status);
      break;
    case 'sensor_motion.aq2':
      this.addMotionSensor(message.sid);
      this.updateBooleanSensor(message.sid, message.data.status);
      break;
    case 'motion':
      this.addMotionSensor(message.sid);
      this.updateBooleanSensor(message.sid, message.data.status);
      break;
    case 'magnet':
      this.addMagnetSensor(message.sid);
      this.updateBooleanSensor(message.sid, message.data.status);
      break;
    case 'plug':
      this.addPlugSensor(message.sid);
      this.updateBooleanSensor(message.sid, message.data.status);
      break;
    case 'weather.v1': {
      const tableData = JSON.parse(message.data);
      tableData.temperature /= 100;
      tableData.humidity /= 100;
      if (tableData.voltage < 2800) {
        tableData.voltage = 0;
      } else if (tableData.voltage > 3300) {
        tableData.voltage = 100;
      } else {
        tableData.voltage = ((tableData.voltage - 2800) * 100) / 500;
      }
      this.addTemperatureSensor(message.sid);
      this.updateTemperatureSensor(message.sid, tableData);
      break;
    }
    default:
      break;
  }
}

module.exports = {
  onMessage,
};
