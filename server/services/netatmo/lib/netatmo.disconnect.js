const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

/**
 * @description Disconnects service and dependencies.
 * @param {object} netatmoHandler - Netatmo handler.
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
    accessToken: '',
    refreshToken: '',
    expireIn: 0,
    connected: false,
  };
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
