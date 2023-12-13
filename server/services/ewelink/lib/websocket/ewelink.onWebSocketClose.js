const logger = require('../../../../utils/logger');

/**
 * @description Action to execute when WebSocket is closed.
 * @example
 * await this.onWebSocketClose();
 */
async function onWebSocketClose() {
  logger.warn('eWeLink: WebSocket is closed');

  // Try to reopen it if Gladys is not stopping
  if (this.ewelinkWebSocketClient !== null) {
    await this.createWebSocketClient();
  }
}

module.exports = {
  onWebSocketClose,
};
