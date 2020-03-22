const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When an error occur
 * @example
 * rflink.on('failed', this.driverFailed);
 */
function failed() {
  logger.debug(`RFlink: Failed to start`);
  this.connected = false;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.RFLINK.ERROR,
    payload: {},
  });
}

module.exports = {
  failed,
};
