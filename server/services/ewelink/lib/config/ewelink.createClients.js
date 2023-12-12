/**
 * @description Create eWeLink Web API and WebSocket clients.
 * @example
 * this.createClients();
 */
function createClients() {
  const { applicationId, applicationSecret, applicationRegion } = this.configuration;

  this.ewelinkWebAPIClient = new this.eweLinkApi.WebAPI({
    appId: applicationId,
    appSecret: applicationSecret,
    region: applicationRegion,
  });

  this.ewelinkWebSocketClientFactory = new this.eweLinkApi.Ws({
    appId: applicationId,
    appSecret: applicationSecret,
    region: applicationRegion,
  });
}

module.exports = {
  createClients,
};
