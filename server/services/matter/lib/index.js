const os = require('os');

const { JOB_TYPES } = require('../../../utils/constants');
const { init } = require('./matter.init');
const { stop } = require('./matter.stop');
const { pairDevice } = require('./matter.pairDevice');
const { getDevices } = require('./matter.getDevices');
const { setValue } = require('./matter.setValue');
const { listenToStateChange } = require('./matter.listenToStateChange');
const { decommission } = require('./matter.decommission');
const { getNodes } = require('./matter.getNodes');
const { handleNode } = require('./matter.handleNode');
const { checkIpv6 } = require('./matter.checkIpv6');
const { refreshDevices } = require('./matter.refreshDevices');
const { backupController } = require('./matter.backupController');
const { restoreBackup } = require('./matter.restoreBackup');

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
  this.backupController = gladys.job.wrapper(JOB_TYPES.SERVICE_MATTER_BACKUP, this.backupController.bind(this));
  process.on('SIGTERM', this.stop);
  process.on('SIGINT', this.stop);
};

MatterHandler.prototype.init = init;
MatterHandler.prototype.stop = stop;
MatterHandler.prototype.pairDevice = pairDevice;
MatterHandler.prototype.getDevices = getDevices;
MatterHandler.prototype.setValue = setValue;
MatterHandler.prototype.listenToStateChange = listenToStateChange;
MatterHandler.prototype.decommission = decommission;
MatterHandler.prototype.getNodes = getNodes;
MatterHandler.prototype.handleNode = handleNode;
MatterHandler.prototype.checkIpv6 = checkIpv6;
MatterHandler.prototype.refreshDevices = refreshDevices;
MatterHandler.prototype.backupController = backupController;
MatterHandler.prototype.restoreBackup = restoreBackup;

module.exports = MatterHandler;
