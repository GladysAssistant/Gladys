const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} mqttDevice - Discovered device.
 * @example
 * notifyNewDevice(discorveredDevice)
 */
function notifyNewDevice(mqttDevice) {
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_MQTT_DEVICE,
    payload: mqttDevice,
  });
}

module.exports = {
  notifyNewDevice,
};
