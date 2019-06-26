const Docker = require('dockerode');

const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');
const { downloadUpgrade } = require('./system.downloadUpgrade');
const { init } = require('./system.init');
const { installUpgrade } = require('./system.installUpgrade');
const { isDocker } = require('./system.isDocker');
const { getContainers } = require('./system.getContainers');
const { getInfos } = require('./system.getInfos');
const { getDiskSpace } = require('./system.getDiskSpace');
const { saveLatestGladysVersion } = require('./system.saveLatestGladysVersion');
const { shutdown } = require('./system.shutdown');

const System = function System(sequelize, event) {
  this.downloadUpgradeError = null;
  this.downloadUpgradeFinished = null;
  this.downloadUpgradeLastEvent = null;
  this.Docker = Docker;
  this.sequelize = sequelize;
  this.event = event;
  this.dockerode = null;
  this.event.on(EVENTS.SYSTEM.DOWNLOAD_UPGRADE, eventFunctionWrapper(this.downloadUpgrade.bind(this)));
};

System.prototype.downloadUpgrade = downloadUpgrade;
System.prototype.init = init;
System.prototype.installUpgrade = installUpgrade;
System.prototype.isDocker = isDocker;
System.prototype.getContainers = getContainers;
System.prototype.getInfos = getInfos;
System.prototype.getDiskSpace = getDiskSpace;
System.prototype.saveLatestGladysVersion = saveLatestGladysVersion;
System.prototype.shutdown = shutdown;

module.exports = System;
