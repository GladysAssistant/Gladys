const { init } = require('./netatmo.init');
const { connect, retrieveTokens } = require('./netatmo.connect');
const { disconnect } = require('./netatmo.disconnect');
const { setTokens } = require('./netatmo.setTokens');
const { getAccessToken } = require('./netatmo.getAccessToken');
const { getRefreshToken } = require('./netatmo.getRefreshToken');
const { refreshingTokens } = require('./netatmo.refreshingTokens');
const { getConfiguration } = require('./netatmo.getConfiguration');
const { getStatus, saveStatus } = require('./netatmo.status');
const { saveConfiguration } = require('./netatmo.saveConfiguration');

const { STATUS } = require('./utils/netatmo.constants');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.baseUrl = 'https://api.netatmo.net';

  this.configured = false;
  this.connected = false;
  this.redirectUri = null;
  this.stateGetAccessToken = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollEnergy = undefined;
  this.scopes = {
    netatmoEnergy: false,
  };
};

NetatmoHandler.prototype.init = init;
NetatmoHandler.prototype.connect = connect;
NetatmoHandler.prototype.retrieveTokens = retrieveTokens;
NetatmoHandler.prototype.disconnect = disconnect;
NetatmoHandler.prototype.setTokens = setTokens;
NetatmoHandler.prototype.getStatus = getStatus;
NetatmoHandler.prototype.saveStatus = saveStatus;
NetatmoHandler.prototype.getAccessToken = getAccessToken;
NetatmoHandler.prototype.getRefreshToken = getRefreshToken;
NetatmoHandler.prototype.refreshingTokens = refreshingTokens;
NetatmoHandler.prototype.getConfiguration = getConfiguration;
NetatmoHandler.prototype.saveConfiguration = saveConfiguration;

module.exports = NetatmoHandler;
