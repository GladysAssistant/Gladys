const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { ACTIONS } = require('../utils/broadlink.constants');
/**
 * @description Entering peripheral in learn mode.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @returns {Promise} Resolve when learn mode is entered.
 * @example
 * await gladys.broadlink.learn('770f78b9401c');
 */
async function learn(peripheralIdentifier) {
  logger.debug(`Broalink entering learn mode with ${peripheralIdentifier}`);
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
      await peripheral.enterLearning();

      // async check data
      logger.debug(`Broadlink entering ${peripheralIdentifier} in learn mode...`);
      await this.checkData(peripheral, peripheralIdentifier);
    } catch (e) {
      logger.error(`Broadlink fails to enter in learning mode on ${peripheralIdentifier} device`, e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
        payload: {
          action: ACTIONS.LEARN.ERROR,
        },
      });
    }
  }

  return null;
}

module.exports = {
  learn,
};
