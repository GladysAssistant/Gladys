const { discover } = require('./device/discover');
const { poll } = require('./device/poll');
const { setValue } = require('./device/setValue');

const { updateStatus } = require('./config/ewelink.updateStatus');

const { getStatus } = require('./config/ewelink.getStatus');
const { saveConfiguration } = require('./config/ewelink.saveConfiguration');
const { loadConfiguration } = require('./config/ewelink.loadConfiguration');
const { createClient } = require('./config/ewelink.createClient');

const { buildLoginUrl } = require('./user/ewelink.buildLoginUrl');
const { exchangeToken } = require('./user/ewelink.exchangeToken');
const { deleteTokens } = require('./user/ewelink.deleteTokens');
const { saveTokens } = require('./user/ewelink.saveTokens');

const { handleRequest } = require('./handlers/ewelink.handleRequest');
const { handleResponse } = require('./handlers/ewelink.handleResponse');

const { init } = require('./ewelink.init');
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

  this.ewelinkClient = null;
  this.loginState = null;
  this.configuration = {};
  this.status = {
    configured: false,
    connected: false,
  };
};

EweLinkHandler.prototype.updateStatus = updateStatus;

EweLinkHandler.prototype.saveConfiguration = saveConfiguration;
EweLinkHandler.prototype.loadConfiguration = loadConfiguration;
EweLinkHandler.prototype.createClient = createClient;

EweLinkHandler.prototype.buildLoginUrl = buildLoginUrl;
EweLinkHandler.prototype.exchangeToken = exchangeToken;
EweLinkHandler.prototype.deleteTokens = deleteTokens;
EweLinkHandler.prototype.saveTokens = saveTokens;

EweLinkHandler.prototype.handleRequest = handleRequest;
EweLinkHandler.prototype.handleResponse = handleResponse;

EweLinkHandler.prototype.discover = discover;
EweLinkHandler.prototype.poll = poll;
EweLinkHandler.prototype.setValue = setValue;
EweLinkHandler.prototype.getStatus = getStatus;

EweLinkHandler.prototype.init = init;
EweLinkHandler.prototype.upgrade = upgrade;

module.exports = EweLinkHandler;
