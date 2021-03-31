const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { ACTIONS } = require('../utils/broadlink.constants');
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
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.NO_PERIPHERAL,
      },
    });
  } else if (!peripheral.learnCode) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.ERROR,
      },
    });
  } else {
    peripheral.learnCode((noVal, payload) => {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
        payload: {
          action: ACTIONS.LEARN.SUCCESS,
          code: payload.toString('hex'),
        },
      });
    });
  }
}

module.exports = {
  learn,
};
