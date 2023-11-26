const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

/**
 * @description Disconnects service and dependencies.
 * @example
 * disconnect();
 */
function disconnect(netatmoHandler) {
  logger.debug('Disonnecting from Netatmo...');
  netatmoHandler.status = STATUS.DISCONNECTING;
  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  const tokens = {
    access_token: '',
    refresh_token: '',
    expire_in: 0,
    connected: false
  };
  netatmoHandler.connector = null;
  netatmoHandler.setTokens(tokens);

  netatmoHandler.status = STATUS.DISCONNECTED;
  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });
}

module.exports = {
  disconnect,
};
