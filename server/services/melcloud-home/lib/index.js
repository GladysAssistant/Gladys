const { init } = require('./melcloud-home.init');
const { connect } = require('./auth/melcloud-home.connect');
const { disconnect } = require('./melcloud-home.disconnect');
const { getAccessToken } = require('./auth/melcloud-home.getAccessToken');
const { storeTokens } = require('./auth/melcloud-home.storeTokens');
const { getConfiguration } = require('./melcloud-home.getConfiguration');
const { saveConfiguration } = require('./melcloud-home.saveConfiguration');
const { discoverDevices } = require('./melcloud-home.discoverDevices');
const { loadDevices } = require('./melcloud-home.loadDevices');
const { setValue } = require('./melcloud-home.setValue');
const { poll } = require('./melcloud-home.poll');

const { STATUS } = require('./utils/melcloud-home.constants');

const MELCloudHomeHandler = function MELCloudHomeHandler(gladys, serviceId, client) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.client = client;

  this.accessToken = null;
  this.refreshToken = null;
  this.tokenExpiresAt = null;
  this.status = STATUS.NOT_INITIALIZED;
};

MELCloudHomeHandler.prototype.init = init;
MELCloudHomeHandler.prototype.connect = connect;
MELCloudHomeHandler.prototype.disconnect = disconnect;
MELCloudHomeHandler.prototype.getAccessToken = getAccessToken;
MELCloudHomeHandler.prototype.storeTokens = storeTokens;
MELCloudHomeHandler.prototype.getConfiguration = getConfiguration;
MELCloudHomeHandler.prototype.saveConfiguration = saveConfiguration;
MELCloudHomeHandler.prototype.discoverDevices = discoverDevices;
MELCloudHomeHandler.prototype.loadDevices = loadDevices;
MELCloudHomeHandler.prototype.setValue = setValue;
MELCloudHomeHandler.prototype.poll = poll;

module.exports = MELCloudHomeHandler;
