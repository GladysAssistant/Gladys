const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { ACTIONS } = require('../utils/broadlink.constants');

/**
 * @description Leaving peripheral learn mode.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @example
 * gladys.broadlink.cancelLearn('770f78b9401c');
 */
function cancelLearn(peripheralIdentifier) {
  logger.debug(`Broalink leaving learn mode with ${peripheralIdentifier}`);
  const peripheral = this.broadlinkDevices[peripheralIdentifier];

  clearTimeout(this.learnTimers[peripheralIdentifier]);

  if (!peripheral) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.NO_PERIPHERAL,
      },
    });
  } else if (!peripheral.cancelLearnCode) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.CANCEL_ERROR,
      },
    });
  } else if (peripheral.learning) {
    peripheral.cancelLearnCode();
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.CANCEL_SUCCESS,
      },
    });
  }
}

module.exports = {
  cancelLearn,
};
