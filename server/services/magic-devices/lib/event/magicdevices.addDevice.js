const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Add device.
 * @param {string} macAdress - hi-flying device mac adress
 * @param {Object} device - Device to add.
 * @example
 * magicDevices.addDevice(macAdress, device);
 */
function addDevice(macAdress, device) {
  const doesntExistYet = this.devices[macAdress] === undefined;
  this.devices[macAdress] = device;
  if (doesntExistYet) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.XIAOMI.NEW_DEVICE,
      payload: device,
    });
    logger.debug('added: ' + JSON.stringify(device));
  }
}

module.exports = {
  addDevice,
};
