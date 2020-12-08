const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Add device.
 * @param {string} sid - Netatmo SID.
 * @param {Object} device - Device to add.
 * @example
 * netatmo.addDevice(sid, device);
 */
function addDevice(sid, device) {
  const doesntExistYet = this.devices[sid] === undefined;
  this.devices[sid] = device;
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
