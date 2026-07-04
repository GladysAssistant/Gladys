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
const { convertDeviceSecurity } = require('./device/netatmo.convertDeviceSecurity');
const { convertDeviceNotSupported } = require('./device/netatmo.convertDeviceNotSupported');
const { discoverDevices } = require('./netatmo.discoverDevices');
const { loadDevices } = require('./netatmo.loadDevices');
const { loadDeviceDetails } = require('./netatmo.loadDeviceDetails');
const { loadThermostatDetails } = require('./netatmo.loadThermostatDetails');
const { loadWeatherStationDetails } = require('./netatmo.loadWeatherStationDetails');
const {
  pollRefreshingToken,
  refreshNetatmoTokens,
  scheduleReconnectAttempt,
} = require('./netatmo.pollRefreshingToken');
const { handleApiAuthError } = require('./netatmo.handleApiAuthError');
const { pollRefreshingValues, refreshNetatmoValues } = require('./netatmo.pollRefreshingValues');
const { setValue } = require('./netatmo.setValue');
const { updateValues } = require('./netatmo.updateValues');
const { updateDevice } = require('./update/netatmo.updateDevice');
const { updateCameraImage } = require('./update/netatmo.updateCameraImage');
const { getCameraBaseUrl, getCameraImage } = require('./netatmo.getCameraImage');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');
const buildScopesConfig = require('./utils/netatmo.buildScopesConfig');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId, childProcess) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.childProcess = childProcess;
  this.configuration = {
    clientId: null,
    clientSecret: null,
    energyApi: null,
    weatherApi: null,
    securityApi: null,
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
  this.reconnectTimeout = undefined;
  this.reconnectAttempt = 0;
  this.firstFatalAt = null;
  this.cameraBaseUrls = {};
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
NetatmoHandler.prototype.convertDeviceSecurity = convertDeviceSecurity;
NetatmoHandler.prototype.convertDeviceNotSupported = convertDeviceNotSupported;
NetatmoHandler.prototype.discoverDevices = discoverDevices;
NetatmoHandler.prototype.loadDevices = loadDevices;
NetatmoHandler.prototype.loadDeviceDetails = loadDeviceDetails;
NetatmoHandler.prototype.loadThermostatDetails = loadThermostatDetails;
NetatmoHandler.prototype.loadWeatherStationDetails = loadWeatherStationDetails;
NetatmoHandler.prototype.pollRefreshingValues = pollRefreshingValues;
NetatmoHandler.prototype.refreshNetatmoValues = refreshNetatmoValues;
NetatmoHandler.prototype.pollRefreshingToken = pollRefreshingToken;
NetatmoHandler.prototype.refreshNetatmoTokens = refreshNetatmoTokens;
NetatmoHandler.prototype.scheduleReconnectAttempt = scheduleReconnectAttempt;
NetatmoHandler.prototype.handleApiAuthError = handleApiAuthError;
NetatmoHandler.prototype.setValue = setValue;
NetatmoHandler.prototype.updateValues = updateValues;
NetatmoHandler.prototype.updateDevice = updateDevice;
NetatmoHandler.prototype.updateCameraImage = updateCameraImage;
NetatmoHandler.prototype.getCameraBaseUrl = getCameraBaseUrl;
NetatmoHandler.prototype.getCameraImage = getCameraImage;

module.exports = NetatmoHandler;
