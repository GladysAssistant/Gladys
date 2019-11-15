const dgram = require('dgram');

// EVENTS
const { addDevice } = require('./event/magicdevices.addDevice');
const { listening } = require('./event/magicdevices.listening');
const { onMessage } = require('./event/magicdevices.onMessage');

// COMMANDS
const { getDevices } = require('./commands/magicdevices.getDevices');
const { listen } = require('./commands/magicdevices.listen');
const { setValue } = require('./commands/magicdevices.setValue');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * MagicDevicesManager(gladys, serviceId)
 */
const MagicDevicesManager = function MagicDevicesManager(gladys, serviceId) {
  this.dgram = dgram;
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.devices = {};

  this.gatewayIpBySensorSid = new Map();
  this.sensorModelBySensorSid = new Map();
  this.gatewayTokenByIp = new Map();
};

// EVENTS
MagicDevicesManager.prototype.addDevice = addDevice;
MagicDevicesManager.prototype.listening = listening;
MagicDevicesManager.prototype.onMessage = onMessage;

// COMMANDS
MagicDevicesManager.prototype.listen = listen;
MagicDevicesManager.prototype.getDevices = getDevices;
MagicDevicesManager.prototype.setValue = setValue;

module.exports = MagicDevicesManager;
