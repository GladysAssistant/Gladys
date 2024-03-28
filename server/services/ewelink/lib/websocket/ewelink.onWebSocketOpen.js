const logger = require('../../../../utils/logger');

/**
 * @description Action to execute when WebSocket is open.
 * @example
 * this.onWebSocketOpen();
 */
function onWebSocketOpen() {
  logger.info('eWeLink: WebSocket is ready');
}

module.exports = {
  onWebSocketOpen,
};
