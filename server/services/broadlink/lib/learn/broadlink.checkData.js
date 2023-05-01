const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ACTIONS } = require('../utils/broadlink.constants');
/**
 * @description Waiting for code learning.
 * @param {object} broadlinkDevice - Braodlink device.
 * @param {string} peripheralIdentifier - The peripheral address.
 * @param {number} iteration - Number of retry.
 * @example
 * await gladys.broadlink.checkData({}));
 */
async function checkData(broadlinkDevice, peripheralIdentifier, iteration = 1) {
  if (iteration === 30) {
    // Auto-stop learn mode after 30 iterations
    clearTimeout(this.learnTimers[peripheralIdentifier]);
    this.cancelLearn(peripheralIdentifier);
    return;
  }

  try {
    const payload = await broadlinkDevice.checkData();

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: ACTIONS.LEARN.SUCCESS,
        code: payload.toString('hex'),
      },
    });
  } catch (e) {
    this.learnTimers[peripheralIdentifier] = setTimeout(
      () => this.checkData(broadlinkDevice, peripheralIdentifier, iteration + 1),
      800,
    );
  }
}

module.exports = {
  checkData,
};
