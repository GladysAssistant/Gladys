const { connect } = require('./tuya.connect');
const { disconnect } = require('./tuya.disconnect');
const { saveTokens } = require('./tuya.saveTokens');
const { getAccessToken } = require('./tuya.getAccessToken');
const { getRefreshToken } = require('./tuya.getRefreshToken');

const TuyaHandler = function TuyaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.context = null;
};

TuyaHandler.prototype.connect = connect;
TuyaHandler.prototype.disconnect = disconnect;
TuyaHandler.prototype.saveTokens = saveTokens;
TuyaHandler.prototype.getAccessToken = getAccessToken;
TuyaHandler.prototype.getRefreshToken = getRefreshToken;

module.exports = TuyaHandler;
