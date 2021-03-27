const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Entering peripheral in learn mode.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @example
 * gladys.broadlink.learn('770f78b9401c');
 */
function learn(peripheralIdentifier) {
  logger.debug(`Broalink entering learn mode with ${peripheralIdentifier}`);
  const peripheral = this.broadlinkDevices[peripheralIdentifier];

  if (!peripheral) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.NO_PERIPHERAL,
      payload: {
        action: 'learnMode',
      },
    });
  } else if (!peripheral.learnCode) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE_ERROR,
    });
  } else {
    peripheral.learnCode((noVal, payload) => {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE_SUCCESS,
        payload: {
          code: payload.toString('hex'),
        },
      });
    });
  }
}

module.exports = {
  learn,
};
