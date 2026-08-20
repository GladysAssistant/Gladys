const Docker = require('dockerode');

const { EVENTS, JOB_TYPES } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');
const { init } = require('./system.init');
const { installUpgrade } = require('./system.installUpgrade');
const { isDocker } = require('./system.isDocker');
const { getGladysBasePath } = require('./system.getGladysBasePath');
const { getContainers } = require('./system.getContainers');
const { getContainerMounts } = require('./system.getContainerMounts');
const { inspectContainer } = require('./system.inspectContainer');
const { getContainerLogs } = require('./system.getContainerLogs');
const { getGladysLogs } = require('./system.getGladysLogs');
const { getGladysContainerId } = require('./system.getGladysContainerId');
const { getGladysImage } = require('./system.getGladysImage');
const { getInfos } = require('./system.getInfos');
const { getDiskSpace } = require('./system.getDiskSpace');
const { saveLatestGladysVersion } = require('./system.saveLatestGladysVersion');

const { pull } = require('./system.pull');
const { getImagePullTime } = require('./system.getImagePullTime');
const { exec } = require('./system.exec');
const { createContainer } = require('./system.createContainer');
const { updateContainer } = require('./system.updateContainer');
const { createNetwork } = require('./system.createNetwork');
const { connectToNetwork } = require('./system.connectToNetwork');
const { inspectNetwork } = require('./system.inspectNetwork');
const { removeNetwork } = require('./system.removeNetwork');
const { getNetworks } = require('./system.getNetworks');
const { detectHardwareClasses } = require('./system.detectHardwareClasses');
const { getImageLabels } = require('./system.getImageLabels');
const { imageExists } = require('./system.imageExists');
const { listImages } = require('./system.listImages');
const { removeImage } = require('./system.removeImage');
const { restartContainer } = require('./system.restartContainer');
const { removeContainer } = require('./system.removeContainer');
const { stopContainer } = require('./system.stopContainer');
const { getNetworkMode } = require('./system.getNetworkMode');
const { hasCpuCfsSupport } = require('./system.hasCpuCfsSupport');
const { vacuum } = require('./system.vacuum');
const { checkIfGladysUpgraded } = require('./system.checkIfGladysUpgraded');
const { setDuckDbTimezone } = require('./system.setDuckDbTimezone');

const { shutdown } = require('./system.shutdown');
const { rebootHost } = require('./system.rebootHost');
const { shutdownHost } = require('./system.shutdownHost');
const { detectHostPowerManagement } = require('./system.detectHostPowerManagement');
const { runHostPowerDbusCommand } = require('./system.runHostPowerDbusCommand');

const System = function System(sequelize, event, config, job, variable, user, message, brain) {
  this.downloadUpgradeError = null;
  this.downloadUpgradeFinished = null;
  this.downloadUpgradeLastEvent = null;
  this.Docker = Docker;
  this.sequelize = sequelize;
  this.event = event;
  this.config = config;
  this.job = job;
  this.variable = variable;
  this.user = user;
  this.message = message;
  this.brain = brain;
  this.dockerode = null;
  this.vacuum = this.job.wrapper(JOB_TYPES.VACUUM, this.vacuum.bind(this));
  this.event.on(EVENTS.SYSTEM.VACUUM, eventFunctionWrapper(this.vacuum.bind(this)));
  this.event.on(EVENTS.SYSTEM.UPGRADE_CONTAINERS, eventFunctionWrapper(this.installUpgrade.bind(this)));
  // on timezone change, reset DuckDB timezone
  this.event.on(EVENTS.SYSTEM.TIMEZONE_CHANGED, eventFunctionWrapper(this.setDuckDbTimezone.bind(this)));
  this.networkMode = null;
  this.cpuCfsSupport = null;
  this.gladysLogsCache = null;
  this.gladysImage = null;
  // image reference -> timestamp of the last pull, read by the external
  // integration image cleanup so it never collects an image pulled seconds
  // ago. Bounded in practice by the number of distinct images Gladys pulls.
  this.imagePullTimes = new Map();
  // Detected host power-management mechanism ('local' | 'docker-helper' | null)
  // and per-action availability, populated by detectHostPowerManagement() at
  // init and cached here.
  this.hostPowerManagement = null;
  this.hostPowerCapabilities = { reboot: false, shutdown: false };
};

System.prototype.init = init;
System.prototype.installUpgrade = installUpgrade;
System.prototype.isDocker = isDocker;
System.prototype.getContainers = getContainers;
System.prototype.getContainerMounts = getContainerMounts;
System.prototype.inspectContainer = inspectContainer;
System.prototype.getContainerLogs = getContainerLogs;
System.prototype.getGladysLogs = getGladysLogs;
System.prototype.getGladysBasePath = getGladysBasePath;
System.prototype.getGladysContainerId = getGladysContainerId;
System.prototype.getGladysImage = getGladysImage;
System.prototype.getInfos = getInfos;
System.prototype.getDiskSpace = getDiskSpace;
System.prototype.saveLatestGladysVersion = saveLatestGladysVersion;
System.prototype.checkIfGladysUpgraded = checkIfGladysUpgraded;

System.prototype.pull = pull;
System.prototype.getImagePullTime = getImagePullTime;
System.prototype.exec = exec;
System.prototype.createContainer = createContainer;
System.prototype.updateContainer = updateContainer;
System.prototype.createNetwork = createNetwork;
System.prototype.connectToNetwork = connectToNetwork;
System.prototype.inspectNetwork = inspectNetwork;
System.prototype.removeNetwork = removeNetwork;
System.prototype.getNetworks = getNetworks;
System.prototype.detectHardwareClasses = detectHardwareClasses;
System.prototype.getImageLabels = getImageLabels;
System.prototype.imageExists = imageExists;
System.prototype.listImages = listImages;
System.prototype.removeImage = removeImage;
System.prototype.restartContainer = restartContainer;
System.prototype.removeContainer = removeContainer;
System.prototype.stopContainer = stopContainer;
System.prototype.getNetworkMode = getNetworkMode;
System.prototype.hasCpuCfsSupport = hasCpuCfsSupport;
System.prototype.vacuum = vacuum;
System.prototype.setDuckDbTimezone = setDuckDbTimezone;
System.prototype.shutdown = shutdown;
System.prototype.rebootHost = rebootHost;
System.prototype.shutdownHost = shutdownHost;
System.prototype.detectHostPowerManagement = detectHostPowerManagement;
System.prototype.runHostPowerDbusCommand = runHostPowerDbusCommand;

module.exports = System;
