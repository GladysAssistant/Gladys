const logger = require('../../../../utils/logger');

/**
 * @description Action to execute when WebSocket is closed.
 * @example
 * this.onWebSocketClose();
 */
function onWebSocketClose() {
  this.closeWebSocketClient();
  logger.info('eWeLink: WebSocket is closed');
}

module.exports = {
  onWebSocketClose,
};
