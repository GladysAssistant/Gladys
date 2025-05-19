const { init } = require('./tuya.init');
const { connect } = require('./tuya.connect');
const { disconnect } = require('./tuya.disconnect');
const { setTokens } = require('./tuya.setTokens');
const { getAccessToken } = require('./tuya.getAccessToken');
const { getRefreshToken } = require('./tuya.getRefreshToken');
const { getConfiguration } = require('./tuya.getConfiguration');
const { saveConfiguration } = require('./tuya.saveConfiguration');
const { discoverDevices } = require('./tuya.discoverDevices');
const { loadDevices } = require('./tuya.loadDevices');
const { loadDeviceDetails } = require('./tuya.loadDeviceDetails');
const { setValue } = require('./tuya.setValue');
const { handleFeedbackFromTuya } = require('./tuya.handleFeedbackFromTuya');

const { STATUS } = require('./utils/tuya.constants');

const TuyaHandler = function TuyaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.connector = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.ws = null;
};

TuyaHandler.prototype.init = init;
TuyaHandler.prototype.connect = connect;
TuyaHandler.prototype.disconnect = disconnect;
TuyaHandler.prototype.setTokens = setTokens;
TuyaHandler.prototype.getAccessToken = getAccessToken;
TuyaHandler.prototype.getRefreshToken = getRefreshToken;
TuyaHandler.prototype.getConfiguration = getConfiguration;
TuyaHandler.prototype.saveConfiguration = saveConfiguration;
TuyaHandler.prototype.discoverDevices = discoverDevices;
TuyaHandler.prototype.loadDevices = loadDevices;
TuyaHandler.prototype.loadDeviceDetails = loadDeviceDetails;
TuyaHandler.prototype.setValue = setValue;
TuyaHandler.prototype.handleFeedbackFromTuya = handleFeedbackFromTuya;

module.exports = TuyaHandler;
