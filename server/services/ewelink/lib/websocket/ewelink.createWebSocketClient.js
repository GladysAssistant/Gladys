/**
 * @description Create WebSocket client.
 * @example
 * await this.createWebSocketClient();
 */
async function createWebSocketClient() {
  const { applicationId: appId, applicationRegion: region } = this.configuration;
  this.ewelinkWebSocketClient.userApiKey = this.userApiKey;
  await this.ewelinkWebSocketClient.Connect.create(
    {
      appId,
      region,
      at: this.ewelinkWebAPIClient.at,
    },
    this.onWebSocketOpen.bind(this),
    this.onWebSocketClose.bind(this),
    this.onWebSocketError.bind(this),
    this.onWebSocketMessage.bind(this),
  );
}

module.exports = {
  createWebSocketClient,
};
