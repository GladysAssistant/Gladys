const { EVENTS } = require('../../../utils/constants');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {object} device - Discovered device.
 * @param {string} event - The vent to publish to.
 * @example
 * notifyNewDevice(discorveredDevice)
 */
function notifyNewDevice(device, event) {
  const payload = this.mergeWithExistingDevice(device);
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: event,
    payload,
  });
}

module.exports = {
  notifyNewDevice,
};
