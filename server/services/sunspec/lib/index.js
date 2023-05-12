const { connect } = require('./sunspec.connect');
const { disconnect } = require('./sunspec.disconnect');
const { getStatus } = require('./getStatus');
const { getDevices } = require('./sunspec.getDevices');
const { getConfiguration } = require('./sunspec.getConfiguration');
const { updateConfiguration } = require('./sunspec.updateConfiguration');
const { scanNetwork } = require('./sunspec.scanNetwork');
const { scanDevices } = require('./sunspec.scanDevices');

const SunSpecManager = function SunSpecManager(gladys, ModbusTCP, serviceId) {
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.devices = {};
  this.modbusClient = new ModbusTCP();
  this.connected = false;
  this.scanInProgress = false;
};

SunSpecManager.prototype.connect = connect;
SunSpecManager.prototype.disconnect = disconnect;
SunSpecManager.prototype.getStatus = getStatus;
SunSpecManager.prototype.getConfiguration = getConfiguration;
SunSpecManager.prototype.getDevices = getDevices;
SunSpecManager.prototype.scanNetwork = scanNetwork;
SunSpecManager.prototype.scanDevices = scanDevices;
SunSpecManager.prototype.updateConfiguration = updateConfiguration;

module.exports = SunSpecManager;
