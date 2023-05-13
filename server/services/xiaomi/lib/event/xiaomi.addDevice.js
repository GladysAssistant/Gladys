const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Add device.
 * @param {string} sid - Xiaomi SID.
 * @param {object} device - Device to add.
 * @example
 * xiaomi.addDevice(sid, device);
 */
function addDevice(sid, device) {
  const doesntExistYet = this.sensors[sid] === undefined;
  this.sensors[sid] = device;
  if (doesntExistYet) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.XIAOMI.NEW_DEVICE,
      payload: device,
    });
  }
}

module.exports = {
  addDevice,
};
