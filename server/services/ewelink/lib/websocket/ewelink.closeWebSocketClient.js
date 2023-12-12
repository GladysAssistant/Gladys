/**
 * @description Close WebSocket client.
 * @example
 * this.closeWebSocketClient();
 */
function closeWebSocketClient() {
  if (this.ewelinkWebSocketClient !== null) {
    this.ewelinkWebSocketClient.close();
    this.ewelinkWebSocketClient = null;
  }
}

module.exports = {
  closeWebSocketClient,
};
