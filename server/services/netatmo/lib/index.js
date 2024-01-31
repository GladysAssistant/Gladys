const { init } = require('./netatmo.init');
const { connect } = require('./netatmo.connect');
const { retrieveTokens } = require('./netatmo.retrieveTokens');
const { disconnect } = require('./netatmo.disconnect');
const { setTokens } = require('./netatmo.setTokens');
const { getAccessToken } = require('./netatmo.getAccessToken');
const { getRefreshToken } = require('./netatmo.getRefreshToken');
const { refreshingTokens } = require('./netatmo.refreshingTokens');
const { getConfiguration } = require('./netatmo.getConfiguration');
const { getStatus } = require('./netatmo.getStatus');
const { saveStatus } = require('./netatmo.saveStatus');
const { saveConfiguration } = require('./netatmo.saveConfiguration');
const { discoverDevices } = require('./netatmo.discoverDevices');
const { loadDevices } = require('./netatmo.loadDevices');
const { loadDeviceDetails } = require('./netatmo.loadDeviceDetails');
const { loadThermostatDetails } = require('./netatmo.loadThermostatDetails');
const { pollRefreshingToken } = require('./netatmo.pollRefreshingToken');
const { pollRefreshingValues } = require('./netatmo.pollRefreshingValues');
const { setValue } = require('./netatmo.setValue');
const { updateValues } = require('./netatmo.updateValues');
const { updateNAPlug } = require('./device/netatmo.updateNAPlug');
const { updateNATherm1 } = require('./device/netatmo.updateNATherm1');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');
const buildScopesConfig = require('./utils/netatmo.buildScopesConfig');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    clientId: null,
    clientSecret: null,
    scopes: buildScopesConfig(SCOPES),
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
NetatmoHandler.prototype.updateValues = updateValues;
NetatmoHandler.prototype.updateNAPlug = updateNAPlug;
NetatmoHandler.prototype.updateNATherm1 = updateNATherm1;

module.exports = NetatmoHandler;
