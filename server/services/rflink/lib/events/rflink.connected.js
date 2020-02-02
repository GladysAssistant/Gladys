const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When the gateway is connected
 * @example
 * rflink.on('connected', this.connected);
 */
function connected() {
  logger.debug(`Rflink : Gateway is connected`);
  this.connected = true;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.RFLINK.CONNECTED,
    payload: {},
  });
}

module.exports = {
  connected,
};
