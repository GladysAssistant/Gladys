/**
 * @description Initialize service with properties and connect to devices.
 * @example tessie.init();
 */
async function init() {
  await this.getConfiguration();
  this.configured = true;
  await this.connect();

  if (this.vehicles && this.vehicles.length > 0) {
    await this.refreshTessieValues();
    await this.startPolling();

    // Initialiser les connexions WebSocket si activé
    if (this.configuration.websocketEnabled && this.configuration.apiKey) {
      await this.initWebSocketConnections();
    }
  }
}

module.exports = {
  init,
};
