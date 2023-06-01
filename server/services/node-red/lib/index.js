const { init } = require('./init');
const { getConfiguration } = require('./getConfiguration');
const { saveConfiguration } = require('./saveConfiguration');
const { installContainer } = require('./installContainer');

const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { status } = require('./status');
const { isEnabled } = require('./isEnabled');
const { checkForContainerUpdates } = require('./checkForContainerUpdates');

const { configureContainer } = require('./configureContainer');
const { setup } = require('./setup');
const { saveZ2mBackup } = require('./saveZ2mBackup');
const { restoreZ2mBackup } = require('./restoreZ2mBackup');
const { backup } = require('./backup');
const { JOB_TYPES } = require('../../../utils/constants');

/**
 * @description Add ability to connect to Node-red.
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
  this.nodeRedConnected = false;

  this.gladysConnected = false;
  this.networkModeValid = true;
  this.dockerBased = true;

  this.containerRestartWaitTimeInMs = 5 * 1000;

  this.backup = gladys.job.wrapper(JOB_TYPES.SERVICE_NODE_RED_BACKUP, this.backup.bind(this));
  this.backupJob = {};
  this.backupScheduledJob = null;
};

NodeRedManager.prototype.init = init;
NodeRedManager.prototype.getConfiguration = getConfiguration;
NodeRedManager.prototype.saveConfiguration = saveConfiguration;
NodeRedManager.prototype.installContainer = installContainer;

NodeRedManager.prototype.connect = connect;
NodeRedManager.prototype.disconnect = disconnect;
NodeRedManager.prototype.status = status;
NodeRedManager.prototype.isEnabled = isEnabled;
NodeRedManager.prototype.checkForContainerUpdates = checkForContainerUpdates;
NodeRedManager.prototype.configureContainer = configureContainer;
NodeRedManager.prototype.setup = setup;
NodeRedManager.prototype.saveZ2mBackup = saveZ2mBackup;
NodeRedManager.prototype.restoreZ2mBackup = restoreZ2mBackup;
NodeRedManager.prototype.backup = backup;

module.exports = NodeRedManager;
