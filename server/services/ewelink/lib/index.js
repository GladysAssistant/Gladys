const { discover } = require('./device/discover');
const { setValue } = require('./device/setValue');

const { updateStatus } = require('./config/ewelink.updateStatus');

const { getStatus } = require('./config/ewelink.getStatus');
const { saveConfiguration } = require('./config/ewelink.saveConfiguration');
const { loadConfiguration } = require('./config/ewelink.loadConfiguration');
const { createClients } = require('./config/ewelink.createClients');

const { buildLoginUrl } = require('./user/ewelink.buildLoginUrl');
const { exchangeToken } = require('./user/ewelink.exchangeToken');
const { deleteTokens } = require('./user/ewelink.deleteTokens');
const { saveTokens } = require('./user/ewelink.saveTokens');
const { retrieveUserApiKey } = require('./user/ewelink.retrieveUserApiKey');

const { handleRequest } = require('./handlers/ewelink.handleRequest');
const { handleResponse } = require('./handlers/ewelink.handleResponse');

const { createWebSocketClient } = require('./websocket/ewelink.createWebSocketClient');
const { closeWebSocketClient } = require('./websocket/ewelink.closeWebSocketClient');
const { onWebSocketMessage } = require('./websocket/ewelink.onWebSocketMessage');
const { onWebSocketError } = require('./websocket/ewelink.onWebSocketError');
const { onWebSocketClose } = require('./websocket/ewelink.onWebSocketClose');
const { onWebSocketOpen } = require('./websocket/ewelink.onWebSocketOpen');

const { init } = require('./ewelink.init');
const { stop } = require('./ewelink.stop');
const { upgrade } = require('./versions/ewelink.upgrade');

/**
 * @description Add ability to control an eWeLink device.
 * @param {object} gladys - Gladys instance.
 * @param {object} eweLinkApi - Next eweLink Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const EweLinkHandler = new EweLinkHandler(gladys, client, serviceId);
 */
const EweLinkHandler = function EweLinkHandler(gladys, eweLinkApi, serviceId) {
  this.gladys = gladys;
  this.eweLinkApi = eweLinkApi;
  this.serviceId = serviceId;

  this.ewelinkWebAPIClient = null;
  this.ewelinkWebSocketClient = null;
  this.userApiKey = null;

  this.discoveredDevices = [];

  this.loginState = null;
  this.configuration = {};
  this.status = {
    configured: false,
    connected: false,
  };
};

EweLinkHandler.prototype.updateStatus = updateStatus;
EweLinkHandler.prototype.getStatus = getStatus;

EweLinkHandler.prototype.saveConfiguration = saveConfiguration;
EweLinkHandler.prototype.loadConfiguration = loadConfiguration;
EweLinkHandler.prototype.createClients = createClients;

EweLinkHandler.prototype.buildLoginUrl = buildLoginUrl;
EweLinkHandler.prototype.exchangeToken = exchangeToken;
EweLinkHandler.prototype.deleteTokens = deleteTokens;
EweLinkHandler.prototype.saveTokens = saveTokens;
EweLinkHandler.prototype.retrieveUserApiKey = retrieveUserApiKey;

EweLinkHandler.prototype.handleRequest = handleRequest;
EweLinkHandler.prototype.handleResponse = handleResponse;

EweLinkHandler.prototype.discover = discover;
EweLinkHandler.prototype.setValue = setValue;

EweLinkHandler.prototype.createWebSocketClient = createWebSocketClient;
EweLinkHandler.prototype.closeWebSocketClient = closeWebSocketClient;
EweLinkHandler.prototype.onWebSocketOpen = onWebSocketOpen;
EweLinkHandler.prototype.onWebSocketClose = onWebSocketClose;
EweLinkHandler.prototype.onWebSocketError = onWebSocketError;
EweLinkHandler.prototype.onWebSocketMessage = onWebSocketMessage;

EweLinkHandler.prototype.init = init;
EweLinkHandler.prototype.stop = stop;
EweLinkHandler.prototype.upgrade = upgrade;

module.exports = EweLinkHandler;
