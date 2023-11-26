const { init } = require('./netatmo.init');
const { connect } = require('./netatmo.connect');
const { disconnect } = require('./netatmo.disconnect');
const { setTokens } = require('./netatmo.setTokens');
const { getAccessToken } = require('./netatmo.getAccessToken');
const { getRefreshToken } = require('./netatmo.getRefreshToken');
const { getConfiguration } = require('./netatmo.getConfiguration');
const { saveConfiguration } = require('./netatmo.saveConfiguration');

const { STATUS } = require('./utils/netatmo.constants');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.redirectUri = null;
  this.state = null;
  this.connector = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollEnergy = undefined;
  this.scopes = {
    netatmoEnergy: false,
  };
};

NetatmoHandler.prototype.init = init;
NetatmoHandler.prototype.connect = connect;
NetatmoHandler.prototype.disconnect = disconnect;
NetatmoHandler.prototype.setTokens = setTokens;
NetatmoHandler.prototype.getAccessToken = getAccessToken;
NetatmoHandler.prototype.getRefreshToken = getRefreshToken;
NetatmoHandler.prototype.getConfiguration = getConfiguration;
NetatmoHandler.prototype.saveConfiguration = saveConfiguration;

module.exports = NetatmoHandler;
