const { init } = require('./init');
const { getConfiguration } = require('./getConfiguration');
const { saveConfiguration } = require('./saveConfiguration');
const { installContainer } = require('./installContainer');
const { checkForContainerUpdates } = require('./checkForContainerUpdates');
const { disconnect } = require('./disconnect');
const { isEnabled } = require('./isEnabled');
const { status } = require('./status');
const { configureContainer } = require('./configureContainer');

/**
 * @description Add ability to connect to Node-RED.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const nodeRedManager = new NodeRedManager(gladys, serviceId);
 */
const NodeRedManager = function NodeRedManager(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.nodeRedExist = false;
  this.nodeRedRunning = false;

  this.gladysConnected = false;
  this.networkModeValid = true;
  this.dockerBased = true;

  this.containerRestartWaitTimeInMs = 5 * 1000;
};

NodeRedManager.prototype.init = init;
NodeRedManager.prototype.getConfiguration = getConfiguration;
NodeRedManager.prototype.saveConfiguration = saveConfiguration;
NodeRedManager.prototype.installContainer = installContainer;
NodeRedManager.prototype.checkForContainerUpdates = checkForContainerUpdates;
NodeRedManager.prototype.disconnect = disconnect;
NodeRedManager.prototype.isEnabled = isEnabled;
NodeRedManager.prototype.status = status;
NodeRedManager.prototype.configureContainer = configureContainer;

module.exports = NodeRedManager;
