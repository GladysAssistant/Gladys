const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Add a new device.
 * @param {Object} device - Device to add.
 * @example
 * Rflink.addDevice(device);
 */
function addNewDevice(device) {
  this.newDevices.push(device);
  try {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_DEVICE,
    });
  } catch (e) {
    logger.log(e);
  }
}

module.exports = { addNewDevice };
