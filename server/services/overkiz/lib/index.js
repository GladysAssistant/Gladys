const Bottleneck = require('bottleneck/es5');
const cron = require('node-cron');

const { getConfiguration, updateConfiguration } = require('./commands/overkiz.configuration');
const { connect } = require('./commands/overkiz.connect');
const { disconnect } = require('./commands/overkiz.disconnect');
const { getDevicesStates } = require('./commands/overkiz.getDevicesStates');
const { getOverkizDevices } = require('./commands/overkiz.getOverkizDevices');
const { setValue } = require('./commands/overkiz.setValue');
const { syncOverkizDevices } = require('./commands/overkiz.syncOverkizDevices');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
  minTime: 100, // 100 ms
});

const OverkizManager = function OverkizManager(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.eventManager = gladys.event;
  this.cron = cron;
  this.devices = {};
  this.connected = false;
  this.scanInProgress = false;
};

OverkizManager.prototype.connect = connect;
OverkizManager.prototype.disconnect = disconnect;
OverkizManager.prototype.syncOverkizDevices = syncOverkizDevices;
OverkizManager.prototype.getOverkizDevices = getOverkizDevices;
OverkizManager.prototype.poll = pollLimiter.wrap(getDevicesStates);
OverkizManager.prototype.setValue = setValueLimiter.wrap(setValue);
OverkizManager.prototype.getConfiguration = getConfiguration;
OverkizManager.prototype.updateConfiguration = updateConfiguration;

module.exports = OverkizManager;
