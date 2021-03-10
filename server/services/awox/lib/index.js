const { start } = require('./commands/awox.start');
const { stop } = require('./commands/awox.stop');
const { setValue } = require('./commands/awox.setValue');
const { isSupportedDevice } = require('./commands/awox.isSupportedDevice');
const { getDiscoveredDevice } = require('./commands/awox.getDiscoveredDevice');
const { getDiscoveredDevices } = require('./commands/awox.getDiscoveredDevices');
const { prepareDevice } = require('./commands/awox.prepareDevice');
const { determineHandler } = require('./commands/awox.determineHandler');

const AwoxManager = function AwoxManager(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.bluetooth = undefined;
  this.handlers = {};
};

AwoxManager.prototype.start = start;
AwoxManager.prototype.stop = stop;
AwoxManager.prototype.getDiscoveredDevice = getDiscoveredDevice;
AwoxManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
AwoxManager.prototype.setValue = setValue;
AwoxManager.prototype.isSupportedDevice = isSupportedDevice;
AwoxManager.prototype.prepareDevice = prepareDevice;
AwoxManager.prototype.determineHandler = determineHandler;

module.exports = AwoxManager;
