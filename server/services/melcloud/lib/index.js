const { init } = require('./melcloud.init');
const { connect } = require('./melcloud.connect');
const { disconnect } = require('./melcloud.disconnect');
const { getConfiguration } = require('./melcloud.getConfiguration');
const { saveConfiguration } = require('./melcloud.saveConfiguration');
const { discoverDevices } = require('./melcloud.discoverDevices');
const { loadDevices } = require('./melcloud.loadDevices');
const { setValue } = require('./melcloud.setValue');
const { poll } = require('./melcloud.poll');

const { STATUS } = require('./utils/melcloud.constants');

const MELCloudHandler = function MELCloudHandler(gladys, serviceId, client) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.client = client;

  this.contextKey = null;
  this.status = STATUS.NOT_INITIALIZED;
};

MELCloudHandler.prototype.init = init;
MELCloudHandler.prototype.connect = connect;
MELCloudHandler.prototype.disconnect = disconnect;
MELCloudHandler.prototype.getConfiguration = getConfiguration;
MELCloudHandler.prototype.saveConfiguration = saveConfiguration;
MELCloudHandler.prototype.discoverDevices = discoverDevices;
MELCloudHandler.prototype.loadDevices = loadDevices;
MELCloudHandler.prototype.setValue = setValue;
MELCloudHandler.prototype.poll = poll;

module.exports = MELCloudHandler;
