const Bottleneck = require('bottleneck/es5');
const cron = require('node-cron');

const { enableDiscovery, disableDiscovery, config } = require('./commands/overkiz.config');
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

const OverkizHandler = function OverkizHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.eventManager = gladys.event;
  this.cron = cron;
  this.devices = {};
  this.connected = false;
  this.scanInProgress = false;
};

OverkizHandler.prototype.connect = connect;
OverkizHandler.prototype.disconnect = disconnect;
OverkizHandler.prototype.syncOverkizDevices = syncOverkizDevices;
OverkizHandler.prototype.getOverkizDevices = getOverkizDevices;
OverkizHandler.prototype.poll = pollLimiter.wrap(getDevicesStates);
OverkizHandler.prototype.setValue = setValueLimiter.wrap(setValue);
OverkizHandler.prototype.enableDiscovery = enableDiscovery;
OverkizHandler.prototype.disableDiscovery = disableDiscovery;
OverkizHandler.prototype.config = config;

module.exports = OverkizHandler;
