const { SchemaConnector } = require('st-schema');

/**
 * @description Creates the SmartThings SchemaConnector.
 * @param {string} clientId - The SmartThings API client ID.
 * @param {string} clientSecret - The SmartThings API client secret.
 * @example
 * oauthManager.createConnector(clientId, clientSecret);
 */
function createConnector(clientId, clientSecret) {
  this.connector = new SchemaConnector()
    .clientId(clientId)
    .clientSecret(clientSecret)
    .enableEventLogging(2)
    .discoveryHandler(async (accessToken, response) => {
      this.discoveryHandler(response);
    })
    .stateRefreshHandler(async (accessToken, response, devices) => {
      this.stateRefreshHandler(response, devices);
    })
    .commandHandler(async (accessToken, response, devices) => {
      this.commandHandler(response, devices);
    })
    .callbackAccessHandler(async (accessToken, callbackAuthentication, callbackUrls) => {
      this.callbackAccessHandler(accessToken, callbackAuthentication, callbackUrls);
    })
    .integrationDeletedHandler((accessToken) => {
      this.integrationDeletedHandler(accessToken);
    });
}

module.exports = {
  createConnector,
};
