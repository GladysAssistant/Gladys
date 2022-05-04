const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { ACTIONS } = require('../utils/broadlink.constants');

/**
 * @description Leaving peripheral learn mode.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @example
 * await gladys.broadlink.cancelLearn('770f78b9401c');
 */
async function cancelLearn(peripheralIdentifier) {
  logger.debug(`Broalink leaving learn mode with ${peripheralIdentifier}`);

  clearTimeout(this.learnTimers[peripheralIdentifier]);

  let peripheral;
  try {
    peripheral = await this.getDevice(peripheralIdentifier);
  } catch (e) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.NO_PERIPHERAL,
      },
    });
  }

  if (peripheral) {
    try {
      // cancel
      await peripheral.cancelLearning();
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
        payload: {
          action: ACTIONS.LEARN.CANCEL_SUCCESS,
        },
      });
    } catch (e) {
      logger.error(`Broadlink fails to cancel learning mode on ${peripheralIdentifier} device`, e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
        payload: {
          action: ACTIONS.LEARN.CANCEL_ERROR,
        },
      });
    }
  }
}

module.exports = {
  cancelLearn,
};
