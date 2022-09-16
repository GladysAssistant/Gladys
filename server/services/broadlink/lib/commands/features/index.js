const lightDevices = require('./broadlink.light');
const remoteDevices = require('./broadlink.remote');
const sensorDevices = require('./broadlink.sensor');
const switchDevices = require('./broadlink.switch');

module.exports = {
  DEVICE_MAPPERS: [lightDevices, remoteDevices, sensorDevices, switchDevices],
};
