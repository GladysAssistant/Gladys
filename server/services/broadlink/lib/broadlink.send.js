const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Sending IR code to peripheral.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @param {string} code - IR code to send.
 * @example
 * gladys.broadlink.send('770f78b9401c', '0200ZO4440D2');
 */
function send(peripheralIdentifier, code) {
  logger.debug(`Broalink sending on ${peripheralIdentifier}`);
  const peripheral = this.broadlinkDevices[peripheralIdentifier];

  if (!peripheral) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.NO_PERIPHERAL,
      payload: {
        action: 'sendData',
      },
    });
  } else if (!peripheral.sendData) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE_ERROR,
    });
  } else {
    const bufferCode = Buffer.from(code, 'hex');
    peripheral.sendData(bufferCode);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE_SUCCESS,
    });
  }
}

module.exports = {
  send,
};
