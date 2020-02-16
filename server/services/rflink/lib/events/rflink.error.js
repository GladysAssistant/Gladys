const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When an error occur
 * @param {string} e - The error.
 * @example
 * rflink.on('rflink.error', this.driverError);
 */
function error(e) {

  if (e === 'NoState') {
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NO_STATE_ERROR,
      payload: {},
    });
  }

  logger.debug(`RFlink: can't start rflink service`);

}

module.exports = {
  error,
};
