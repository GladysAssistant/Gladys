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
const { discoverDevices } = require('./netatmo.discoverDevices');
const { loadDevices } = require('./netatmo.loadDevices');
const { loadDeviceDetails } = require('./netatmo.loadDeviceDetails');
const { loadThermostatDetails } = require('./netatmo.loadThermostatDetails');
const { pollRefreshingValues, pollRefreshingToken } = require('./netatmo.poll');
const { setValue } = require('./netatmo.setValue');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    clientId: null,
    clientSecret: null,
    scopes: {
      scopeEnergy: `${SCOPES.ENERGY.read} ${SCOPES.ENERGY.write}`,
    },
  };
  this.configured = false;
  this.connected = false;
  this.redirectUri = null;
  this.accessToken = null;
  this.refreshToken = null;
  this.expireInToken = null;
  this.stateGetAccessToken = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollRefreshToken = undefined;
  this.pollRefreshValues = undefined;
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
NetatmoHandler.prototype.discoverDevices = discoverDevices;
NetatmoHandler.prototype.loadDevices = loadDevices;
NetatmoHandler.prototype.loadDeviceDetails = loadDeviceDetails;
NetatmoHandler.prototype.loadThermostatDetails = loadThermostatDetails;
NetatmoHandler.prototype.pollRefreshingValues = pollRefreshingValues;
NetatmoHandler.prototype.pollRefreshingToken = pollRefreshingToken;
NetatmoHandler.prototype.setValue = setValue;

module.exports = NetatmoHandler;
