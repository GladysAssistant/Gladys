const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Add a new device that can be added to Gladys.
 * @param {Object} device - Device to add in the list of new discovered devices.
 * @example
 * Rflink.addNewDevice(device);
 */
function addNewDevice(device) {
  if (!this.devices.includes(device)) {
    logger.debug(`New device discovered by RFLink Gateway ${device.external_id}`);
    this.newDevices.push(device);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_DEVICE,
    });
  }
}

module.exports = { addNewDevice };
