const { init } = require('./tuya.init');
const { connect } = require('./tuya.connect');
const { disconnect } = require('./tuya.disconnect');
const { setTokens } = require('./tuya.setTokens');
const { getAccessToken } = require('./tuya.getAccessToken');
const { getRefreshToken } = require('./tuya.getRefreshToken');
const { getConfiguration } = require('./tuya.getConfiguration');
const { saveConfiguration } = require('./tuya.saveConfiguration');

const { STATUS } = require('./utils/tuya.constants');

const TuyaHandler = function TuyaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.connector = null;
  this.status = STATUS.NOT_INITIALIZED;
};

TuyaHandler.prototype.init = init;
TuyaHandler.prototype.connect = connect;
TuyaHandler.prototype.disconnect = disconnect;
TuyaHandler.prototype.setTokens = setTokens;
TuyaHandler.prototype.getAccessToken = getAccessToken;
TuyaHandler.prototype.getRefreshToken = getRefreshToken;
TuyaHandler.prototype.getConfiguration = getConfiguration;
TuyaHandler.prototype.saveConfiguration = saveConfiguration;

module.exports = TuyaHandler;
