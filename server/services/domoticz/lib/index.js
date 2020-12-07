// Commands
const { connect } = require('./commands/domoticz.connect');
const { disconnect } = require('./commands/domoticz.disconnect');
const { getDevices } = require('./commands/domoticz.getDevices');
const { completeDevice } = require('./commands/domoticz.completeDevice');
const { poll } = require('./commands/domoticz.poll');

const DomoticzManager = function DomoticzManager(gladys, serviceId) {
  this.client = null;
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.connected = false;
};

// Events

// Commands
DomoticzManager.prototype.connect = connect;
DomoticzManager.prototype.disconnect = disconnect;
DomoticzManager.prototype.getDevices = getDevices;
DomoticzManager.prototype.completeDevice = completeDevice;
DomoticzManager.prototype.poll = poll;

module.exports = DomoticzManager;
