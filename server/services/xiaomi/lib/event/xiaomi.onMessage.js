const logger = require('../../../../utils/logger');

/**
 * @description Get Error
 * @param {string} e - Error.
 * @example
 * onMessage('One Error');
 */
async function onMessage(msg, rsinfo) {
  const message = JSON.parse(msg.toString());
  // receive message from xiaomi
  console.log('\n\n')
  console.log(message)
  console.log('\n\n')
  switch(message.model) {
    case 'switch':
      console.log('switch');
      break;
    case 'remote.b286acn01':
      console.log('remote 2 wireless');
      break;
    case 'sensor_magnet.aq2':
      this.addMagnetSensor(message.sid, message.data.status);
      break;
    case 'sensor_motion.aq2':
      this.addMotionSensor(message.sid, message.data.status);
      break;
    case 'motion':
        this.addMotionSensor(message.sid, message.data.status);
        break;
    case 'magnet':
        this.addMagnetSensor(message.sid, message.data.status);
        break;
    case 'weather.v1':
      if (message.cmd === 'heartbeat') {
        let tableValue = JSON.parse(message.data);
        tableValue.temperature = tableValue.temperature / 100;
        tableValue.humidity = tableValue.humidity / 100;
        if (tableValue.voltage < 2800) {
          tableValue.voltage = 0;
        } else if (tableValue.voltage > 3300) {
          tableValue.voltage = 100;
        } else {
          tableValue.voltage = (tableValue.voltage - 2800) * 100 / 500;
        }
        this.addTemperatureSensor(message.sid, tableValue.temperature, tableValue.humidity, tableValue.pressure, tableValue.voltage);
      };
      break;
  }
}

module.exports = {
  onMessage,
};
