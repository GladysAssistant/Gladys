const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Leaving peripheral learn mode.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @example
 * gladys.broadlink.cancelLearn('770f78b9401c');
 */
function cancelLearn(peripheralIdentifier) {
  logger.debug(`Broalink leaving learn mode with ${peripheralIdentifier}`);
  const peripheral = this.broadlinkDevices[peripheralIdentifier];

  if (!peripheral) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.NO_PERIPHERAL,
      payload: {
        action: 'learnMode',
      },
    });
  } else if (!peripheral.cancelLearnCode) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.CANCEL_LEARN_MODE_ERROR,
    });
  } else {
    peripheral.cancelLearnCode();
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.CANCEL_LEARN_MODE_SUCCESS,
    });
  }
}

module.exports = {
  cancelLearn,
};
