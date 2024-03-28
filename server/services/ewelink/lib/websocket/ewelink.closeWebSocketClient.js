/**
 * @description Close WebSocket client.
 * @example
 * this.closeWebSocketClient();
 */
function closeWebSocketClient() {
  if (this.ewelinkWebSocketClient && this.ewelinkWebSocketClient.Connect && this.ewelinkWebSocketClient.Connect.ws) {
    this.ewelinkWebSocketClient.Connect.ws.close();
  }
}

module.exports = {
  closeWebSocketClient,
};
