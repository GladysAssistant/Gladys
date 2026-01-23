const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('./utils/nuki.constants');

const NukiMQTTHandler = require('./mqtt');
const NukiHTTPHandler = require('./http');

const { start } = require('./commands/nuki.start');
const { stop } = require('./commands/nuki.stop');
const { getStatus } = require('./commands/nuki.getStatus');

const { getConfiguration } = require('./config/nuki.getConfiguration');
const { saveConfiguration } = require('./config/nuki.saveConfiguration');
const { getHandler } = require('./config/nuki.getHandler');

const { scan } = require('./device/nuki.scan');
const { getDiscoveredDevices } = require('./device/nuki.getDiscoveredDevices');
const { getProtocolFromDevice } = require('./device/nuki.getProtocolFromDevice');
const { setValue } = require('./device/nuki.setValue');
const { mergeWithExistingDevice } = require('./device/nuki.mergeWithExistingDevice');
const { notifyNewDevice } = require('./device/nuki.notifyNewDevice');
const { poll } = require('./device/nuki.poll');
const { postCreate } = require('./device/nuki.postCreate');
const { postDelete } = require('./device/nuki.postDelete');

const nukiHandler = function NukiHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.protocols = {};
  // MQTT
  this.protocols[DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT] = new NukiMQTTHandler(this);
  this.protocols[DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP] = new NukiHTTPHandler(this);
};

// COMMANDS
nukiHandler.prototype.start = start;
nukiHandler.prototype.stop = stop;
nukiHandler.prototype.getStatus = getStatus;

// CONFIG
nukiHandler.prototype.getConfiguration = getConfiguration;
nukiHandler.prototype.saveConfiguration = saveConfiguration;
nukiHandler.prototype.getHandler = getHandler;

// DEVICE
nukiHandler.prototype.scan = scan;
nukiHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
nukiHandler.prototype.setValue = setValue;
nukiHandler.prototype.mergeWithExistingDevice = mergeWithExistingDevice;
nukiHandler.prototype.notifyNewDevice = notifyNewDevice;
nukiHandler.prototype.poll = poll;
nukiHandler.prototype.getProtocolFromDevice = getProtocolFromDevice;
nukiHandler.prototype.postCreate = postCreate;
nukiHandler.prototype.postDelete = postDelete;

module.exports = nukiHandler;
