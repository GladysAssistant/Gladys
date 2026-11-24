const os = require('os');

const { JOB_TYPES } = require('../../../utils/constants');
const { init } = require('./matter.init');
const { stop } = require('./matter.stop');
const { pairDevice } = require('./matter.pairDevice');
const { getDevices } = require('./matter.getDevices');
const { getPairedDevices } = require('./matter.getPairedDevices');
const { setValue } = require('./matter.setValue');
const { listenToStateChange } = require('./matter.listenToStateChange');
const { readInitialDeviceStates } = require('./matter.readInitialDeviceStates');
const { decommission } = require('./matter.decommission');
const { getNodes } = require('./matter.getNodes');
const { handleNode } = require('./matter.handleNode');
const { checkIpv6 } = require('./matter.checkIpv6');
const { refreshDevices } = require('./matter.refreshDevices');
const { backupController } = require('./matter.backupController');
const { restoreBackup } = require('./matter.restoreBackup');
const { reset } = require('./matter.reset');
const { watchNode, unwatchNode } = require('./matter.watchNode');
const {
  getNodeStatus,
  notifyNodeStatus,
  setNodeStatus,
  touchNode,
  setDeviceReachability,
  clearNodeStatuses,
} = require('./matter.nodeStatus');
const { getNodeDetails } = require('./matter.getNodeDetails');
const { identifyNode } = require('./matter.identifyNode');
const { shareNode } = require('./matter.shareNode');

/**
 * @description Matter handler.
 * @param {object} gladys - Gladys instance.
 * @param {object} MatterMain - Matter main.
 * @param {object} ProjectChipMatter - Project chip matter.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, serviceId);
 */
const MatterHandler = function MatterHandler(gladys, MatterMain, ProjectChipMatter, serviceId) {
  this.gladys = gladys;
  this.MatterMain = MatterMain;
  this.ProjectChipMatter = ProjectChipMatter;
  this.serviceId = serviceId;
  this.os = os;
  this.devices = [];
  this.nodesMap = new Map();
  this.stateChangeListeners = new Set();
  this.commissioningController = null;
  // Map to store supported modes for RvcRunMode and RvcCleanMode clusters
  // Key: external_id (e.g., "matter:nodeId:devicePath:clusterId")
  // Value: { supportedModes: [{mode: number, label: string, modeTags: [...]}], modeTagToValue: Map }
  this.supportedModesMap = new Map();
  // Connection of the nodes (matter.watchNode.js, matter.nodeStatus.js), keyed by node ID as a string
  this.watchedNodes = new Map();
  this.nodeStatuses = new Map();
  this.nodeStatusTimers = new Map();
  // Paths of the bridged devices each bridge reports unreachable, and the labels of its bridged devices
  this.unreachableDevicePaths = new Map();
  this.bridgedDevices = new Map();
  this.backupController = gladys.job.wrapper(JOB_TYPES.SERVICE_MATTER_BACKUP, this.backupController.bind(this));
  process.on('SIGTERM', this.stop);
  process.on('SIGINT', this.stop);
};

MatterHandler.prototype.init = init;
MatterHandler.prototype.stop = stop;
MatterHandler.prototype.pairDevice = pairDevice;
MatterHandler.prototype.getDevices = getDevices;
MatterHandler.prototype.getPairedDevices = getPairedDevices;
MatterHandler.prototype.setValue = setValue;
MatterHandler.prototype.listenToStateChange = listenToStateChange;
MatterHandler.prototype.readInitialDeviceStates = readInitialDeviceStates;
MatterHandler.prototype.decommission = decommission;
MatterHandler.prototype.getNodes = getNodes;
MatterHandler.prototype.handleNode = handleNode;
MatterHandler.prototype.checkIpv6 = checkIpv6;
MatterHandler.prototype.refreshDevices = refreshDevices;
MatterHandler.prototype.backupController = backupController;
MatterHandler.prototype.restoreBackup = restoreBackup;
MatterHandler.prototype.reset = reset;
MatterHandler.prototype.watchNode = watchNode;
MatterHandler.prototype.unwatchNode = unwatchNode;
MatterHandler.prototype.getNodeStatus = getNodeStatus;
MatterHandler.prototype.notifyNodeStatus = notifyNodeStatus;
MatterHandler.prototype.setNodeStatus = setNodeStatus;
MatterHandler.prototype.touchNode = touchNode;
MatterHandler.prototype.setDeviceReachability = setDeviceReachability;
MatterHandler.prototype.clearNodeStatuses = clearNodeStatuses;
MatterHandler.prototype.getNodeDetails = getNodeDetails;
MatterHandler.prototype.identifyNode = identifyNode;
MatterHandler.prototype.shareNode = shareNode;

module.exports = MatterHandler;
