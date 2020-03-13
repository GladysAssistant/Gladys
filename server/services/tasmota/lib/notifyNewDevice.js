const { EVENTS } = require('../../../utils/constants');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {Object} device - Discovered device.
 * @param {string} event - The vent to publish to.
 * @example
 * notifyNewDevice(discorveredDevice)
 */
function notifyNewDevice(device, event) {
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: event,
    payload: device,
  });
}

module.exports = {
  notifyNewDevice,
};
