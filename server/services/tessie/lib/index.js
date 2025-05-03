const { init } = require('./tessie.init');
const { connect } = require('./tessie.connect');
const { retrieveTokens } = require('./tessie.retrieveTokens');
const { disconnect } = require('./tessie.disconnect');
const { setTokens } = require('./tessie.setTokens');
const { getAccessToken } = require('./tessie.getAccessToken');
const { getRefreshToken } = require('./tessie.getRefreshToken');
const { refreshingTokens } = require('./tessie.refreshingTokens');
const { getConfiguration } = require('./tessie.getConfiguration');
const { getStatus } = require('./tessie.getStatus');
const { saveStatus } = require('./tessie.saveStatus');
const { saveConfiguration } = require('./tessie.saveConfiguration');
const { convertDeviceEnergy } = require('./device/tessie.convertDeviceEnergy');
const { convertDeviceWeather } = require('./device/tessie.convertDeviceWeather');
const { convertDeviceNotSupported } = require('./device/tessie.convertDeviceNotSupported');
const { discoverDevices } = require('./tessie.discoverDevices');
const { loadDevices } = require('./tessie.loadDevices');
const { loadDeviceDetails } = require('./tessie.loadDeviceDetails');
const { loadThermostatDetails } = require('./tessie.loadThermostatDetails');
const { loadWeatherStationDetails } = require('./tessie.loadWeatherStationDetails');
const { pollRefreshingToken } = require('./tessie.pollRefreshingToken');
const { pollRefreshingValues, refreshNetatmoValues } = require('./tessie.pollRefreshingValues');
const { setValue } = require('./tessie.setValue');
const { updateValues } = require('./tessie.updateValues');
const { updateNAPlug } = require('./update/tessie.updateNAPlug');
const { updateNATherm1 } = require('./update/tessie.updateNATherm1');
const { updateNRV } = require('./update/tessie.updateNRV');
const { updateNAMain } = require('./update/tessie.updateNAMain');
const { updateNAModule1 } = require('./update/tessie.updateNAModule1');
const { updateNAModule2 } = require('./update/tessie.updateNAModule2');
const { updateNAModule3 } = require('./update/tessie.updateNAModule3');
const { updateNAModule4 } = require('./update/tessie.updateNAModule4');

const { STATUS, SCOPES } = require('./utils/tessie.constants');
const buildScopesConfig = require('./utils/tessie.buildScopesConfig');

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
