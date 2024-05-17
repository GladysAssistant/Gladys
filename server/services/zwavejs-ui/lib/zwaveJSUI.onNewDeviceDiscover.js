const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { convertToGladysDevice } = require('../utils/convertToGladysDevice');

/**
 * @description This will be called when new Z-Wave devices are discovered.
 * @param {object} data - Data sent by ZWave JS UI.
 * @example zwaveJSUI.onNewDeviceDiscover();
 */
async function onNewDeviceDiscover(data) {
  const devices = [];
  const zwaveDevices = [];
  data.result.forEach((zwaveJSDevice) => {
    zwaveDevices.push(zwaveJSDevice);
    devices.push(convertToGladysDevice(this.serviceId, zwaveJSDevice));
  });
  this.devices = devices;
  this.zwaveJSDevices = zwaveDevices;

  await this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.SCAN_COMPLETED,
  });
}

module.exports = {
  onNewDeviceDiscover,
};
