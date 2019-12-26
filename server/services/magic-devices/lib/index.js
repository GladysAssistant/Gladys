const dgram = require('dgram');

// EVENTS
const { addDevice } = require('./event/magicdevices.addDevice');
const { scan } = require('./event/magicdevices.scan');
const { onMessage } = require('./event/magicdevices.onMessage');

// COMMANDS
const { getDevices } = require('./commands/magicdevices.getDevices');
const { poll } = require('./commands/magicdevices.poll');
const { start } = require('./commands/magicdevices.start');
const { setValue } = require('./commands/magicdevices.setValue');
const { mapKnownDevicesWithGladys } = require('./commands/mapKnownDevicesWithGladys');
// const { Control, Discovery, CustomMode, EffectInterface } = require('magic-home');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description This is the Magic Devices service manager
 * @example
 * MagicDevicesManager(gladys, serviceId)
 */
const MagicDevicesManager = function MagicDevicesManager(gladys, serviceId) {
  this.dgram = dgram;
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.devices = {};

  this.deviceIpByMacAdress = new Map();
};

// EVENTS
MagicDevicesManager.prototype.addDevice = addDevice;
MagicDevicesManager.prototype.scan = scan;
MagicDevicesManager.prototype.onMessage = onMessage;

// COMMANDS
MagicDevicesManager.prototype.start = start;
MagicDevicesManager.prototype.getDevices = getDevices;
MagicDevicesManager.prototype.poll = poll;
MagicDevicesManager.prototype.setValue = setValue;
MagicDevicesManager.prototype.mapKnownDevicesWithGladys = mapKnownDevicesWithGladys;

module.exports = MagicDevicesManager;
