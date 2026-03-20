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
 * @description Add ability to connect to Matterbridge.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
 */
const MatterbridgeManager = function MatterbridgeManager(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.matterbridgeExist = false;
  this.matterbridgeRunning = false;

  this.networkModeValid = true;
  this.dockerBased = true;

  this.containerRestartWaitTimeInMs = 5 * 1000;
};

MatterbridgeManager.prototype.init = init;
MatterbridgeManager.prototype.getConfiguration = getConfiguration;
MatterbridgeManager.prototype.saveConfiguration = saveConfiguration;
MatterbridgeManager.prototype.installContainer = installContainer;
MatterbridgeManager.prototype.checkForContainerUpdates = checkForContainerUpdates;
MatterbridgeManager.prototype.disconnect = disconnect;
MatterbridgeManager.prototype.isEnabled = isEnabled;
MatterbridgeManager.prototype.status = status;
MatterbridgeManager.prototype.configureContainer = configureContainer;

module.exports = MatterbridgeManager;
