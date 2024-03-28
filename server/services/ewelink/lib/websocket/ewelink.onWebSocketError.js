const logger = require('../../../../utils/logger');

/**
 * @description Action to execute when WebSocket is on error state.
 * @param {object} error - WebSocket error.
 * @example
 * this.onWebSocketError();
 */
function onWebSocketError(error) {
  logger.error('eWeLink: WebSocket is on error: %s', error.message);
}

module.exports = {
  onWebSocketError,
};
