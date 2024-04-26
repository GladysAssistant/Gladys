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
const { convertDeviceEnergy } = require('./device/netatmo.convertDeviceEnergy');
const { convertDeviceWeather } = require('./device/netatmo.convertDeviceWeather');
const { convertDeviceNotSupported } = require('./device/netatmo.convertDeviceNotSupported');
const { discoverDevices } = require('./netatmo.discoverDevices');
const { loadDevices } = require('./netatmo.loadDevices');
const { loadDeviceDetails } = require('./netatmo.loadDeviceDetails');
const { loadThermostatDetails } = require('./netatmo.loadThermostatDetails');
const { loadWeatherStationDetails } = require('./netatmo.loadWeatherStationDetails');
const { pollRefreshingToken } = require('./netatmo.pollRefreshingToken');
const { pollRefreshingValues, refreshNetatmoValues } = require('./netatmo.pollRefreshingValues');
const { setValue } = require('./netatmo.setValue');
const { updateValues } = require('./netatmo.updateValues');
const { updateNAPlug } = require('./update/netatmo.updateNAPlug');
const { updateNATherm1 } = require('./update/netatmo.updateNATherm1');
const { updateNRV } = require('./update/netatmo.updateNRV');
const { updateNAMain } = require('./update/netatmo.updateNAMain');
const { updateNAModule1 } = require('./update/netatmo.updateNAModule1');
const { updateNAModule2 } = require('./update/netatmo.updateNAModule2');
const { updateNAModule3 } = require('./update/netatmo.updateNAModule3');
const { updateNAModule4 } = require('./update/netatmo.updateNAModule4');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');
const buildScopesConfig = require('./utils/netatmo.buildScopesConfig');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    clientId: null,
    clientSecret: null,
    energyApi: null,
    weatherApi: null,
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
NetatmoHandler.prototype.convertDeviceEnergy = convertDeviceEnergy;
NetatmoHandler.prototype.convertDeviceWeather = convertDeviceWeather;
NetatmoHandler.prototype.convertDeviceNotSupported = convertDeviceNotSupported;
NetatmoHandler.prototype.discoverDevices = discoverDevices;
NetatmoHandler.prototype.loadDevices = loadDevices;
NetatmoHandler.prototype.loadDeviceDetails = loadDeviceDetails;
NetatmoHandler.prototype.loadThermostatDetails = loadThermostatDetails;
NetatmoHandler.prototype.loadWeatherStationDetails = loadWeatherStationDetails;
NetatmoHandler.prototype.pollRefreshingValues = pollRefreshingValues;
NetatmoHandler.prototype.refreshNetatmoValues = refreshNetatmoValues;
NetatmoHandler.prototype.pollRefreshingToken = pollRefreshingToken;
NetatmoHandler.prototype.setValue = setValue;
NetatmoHandler.prototype.updateValues = updateValues;
NetatmoHandler.prototype.updateNAPlug = updateNAPlug;
NetatmoHandler.prototype.updateNATherm1 = updateNATherm1;
NetatmoHandler.prototype.updateNRV = updateNRV;
NetatmoHandler.prototype.updateNAMain = updateNAMain;
NetatmoHandler.prototype.updateNAModule1 = updateNAModule1;
NetatmoHandler.prototype.updateNAModule2 = updateNAModule2;
NetatmoHandler.prototype.updateNAModule3 = updateNAModule3;
NetatmoHandler.prototype.updateNAModule4 = updateNAModule4;

module.exports = NetatmoHandler;
