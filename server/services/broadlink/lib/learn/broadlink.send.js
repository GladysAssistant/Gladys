const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { ACTIONS } = require('../utils/broadlink.constants');

/**
 * @description Sending IR code to peripheral.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @param {string} code - IR code to send.
 * @example
 * await gladys.broadlink.send('770f78b9401c', '0200ZO4440D2');
 */
async function send(peripheralIdentifier, code) {
  logger.debug(`Broalink sending on ${peripheralIdentifier}`);

  let peripheral;
  try {
    peripheral = await this.getDevice(peripheralIdentifier);

    const bufferCode = Buffer.from(code, 'hex');
    await peripheral.sendData(bufferCode);

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: ACTIONS.SEND.SUCCESS,
      },
    });
  } catch (e) {
    logger.error(`Broadlink fails to send data on ${peripheralIdentifier} device`, e);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: ACTIONS.SEND.ERROR,
      },
    });
  }
}

module.exports = {
  send,
};
