const Docker = require('dockerode');

const { EVENTS, JOB_TYPES } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');
const { downloadUpgrade } = require('./system.downloadUpgrade');
const { init } = require('./system.init');
const { installUpgrade } = require('./system.installUpgrade');
const { isDocker } = require('./system.isDocker');
const { getGladysBasePath } = require('./system.getGladysBasePath');
const { getContainers } = require('./system.getContainers');
const { getContainerMounts } = require('./system.getContainerMounts');
const { inspectContainer } = require('./system.inspectContainer');
const { getGladysContainerId } = require('./system.getGladysContainerId');
const { getInfos } = require('./system.getInfos');
const { getDiskSpace } = require('./system.getDiskSpace');
const { saveLatestGladysVersion } = require('./system.saveLatestGladysVersion');

const { pull } = require('./system.pull');
const { exec } = require('./system.exec');
const { createContainer } = require('./system.createContainer');
const { restartContainer } = require('./system.restartContainer');
const { removeContainer } = require('./system.removeContainer');
const { stopContainer } = require('./system.stopContainer');
const { getNetworkMode } = require('./system.getNetworkMode');
const { vacuum } = require('./system.vacuum');

const { shutdown } = require('./system.shutdown');

const System = function System(sequelize, event, config, job) {
  this.downloadUpgradeError = null;
  this.downloadUpgradeFinished = null;
  this.downloadUpgradeLastEvent = null;
  this.Docker = Docker;
  this.sequelize = sequelize;
  this.event = event;
  this.config = config;
  this.job = job;
  this.dockerode = null;
  this.vacuum = this.job.wrapper(JOB_TYPES.VACUUM, this.vacuum.bind(this));
  this.event.on(EVENTS.SYSTEM.DOWNLOAD_UPGRADE, eventFunctionWrapper(this.downloadUpgrade.bind(this)));
  this.event.on(EVENTS.SYSTEM.VACUUM, eventFunctionWrapper(this.vacuum.bind(this)));
  this.networkMode = null;
};

System.prototype.downloadUpgrade = downloadUpgrade;
System.prototype.init = init;
System.prototype.installUpgrade = installUpgrade;
System.prototype.isDocker = isDocker;
System.prototype.getContainers = getContainers;
System.prototype.getContainerMounts = getContainerMounts;
System.prototype.inspectContainer = inspectContainer;
System.prototype.getGladysBasePath = getGladysBasePath;
System.prototype.getGladysContainerId = getGladysContainerId;
System.prototype.getInfos = getInfos;
System.prototype.getDiskSpace = getDiskSpace;
System.prototype.saveLatestGladysVersion = saveLatestGladysVersion;

System.prototype.pull = pull;
System.prototype.exec = exec;
System.prototype.createContainer = createContainer;
System.prototype.restartContainer = restartContainer;
System.prototype.removeContainer = removeContainer;
System.prototype.stopContainer = stopContainer;
System.prototype.getNetworkMode = getNetworkMode;
System.prototype.vacuum = vacuum;

System.prototype.shutdown = shutdown;

module.exports = System;
