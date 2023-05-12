const dgram = require('dgram');

// EVENTS
const { addDevice } = require('./event/xiaomi.addDevice');
const { newValueCube } = require('./event/xiaomi.newValueCube');
const { newValueGateway } = require('./event/xiaomi.newValueGateway');
const { newValueMagnetSensor } = require('./event/xiaomi.newValueMagnetSensor');
const { newValueMotionSensor } = require('./event/xiaomi.newValueMotionSensor');
const { newValuePlug } = require('./event/xiaomi.newValuePlug');
const { newValueTemperatureSensor } = require('./event/xiaomi.newValueTemperatureSensor');
const { newValueSmoke } = require('./event/xiaomi.newValueSmoke');
const { newValueSwitch } = require('./event/xiaomi.newValueSwitch');
const { newValueSingleWiredSwitch } = require('./event/xiaomi.newValueSingleWiredSwitch');
const { newValueSingleWiredSwitchNeutral } = require('./event/xiaomi.newValueSingleWiredSwitchNeutral');
const { newValueSingleWirelessSwitch } = require('./event/xiaomi.newValueSingleWirelessSwitch');
const { newValueDuplexWiredSwitch } = require('./event/xiaomi.newValueDuplexWiredSwitch');
const { newValueDuplexWiredSwitchNeutral } = require('./event/xiaomi.newValueDuplexWiredSwitchNeutral');
const { newValueDuplexWirelessSwitch } = require('./event/xiaomi.newValueDuplexWirelessSwitch');
const { newValueLeak } = require('./event/xiaomi.newValueLeak');
const { newValueVibration } = require('./event/xiaomi.newValueVibration');
const { listening } = require('./event/xiaomi.listening');
const { onMessage } = require('./event/xiaomi.onMessage');

// COMMANDS
const { getSensors } = require('./commands/xiaomi.getSensors');
const { listen } = require('./commands/xiaomi.listen');
const { setValue } = require('./commands/xiaomi.setValue');

/**
 * @param {object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening.
 * @example
 * XiaomiManager(gladys, serviceId)
 */
const XiaomiManager = function XiaomiManager(gladys, serviceId) {
  this.dgram = dgram;
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.sensors = {};
  this.gatewayIpBySensorSid = new Map();
  this.sensorModelBySensorSid = new Map();
  this.gatewayTokenByIp = new Map();
};

// EVENTS
XiaomiManager.prototype.addDevice = addDevice;
XiaomiManager.prototype.newValueCube = newValueCube;
XiaomiManager.prototype.newValueGateway = newValueGateway;
XiaomiManager.prototype.newValueMagnetSensor = newValueMagnetSensor;
XiaomiManager.prototype.newValueMotionSensor = newValueMotionSensor;
XiaomiManager.prototype.newValuePlug = newValuePlug;
XiaomiManager.prototype.newValueTemperatureSensor = newValueTemperatureSensor;
XiaomiManager.prototype.newValueSmoke = newValueSmoke;
XiaomiManager.prototype.newValueSwitch = newValueSwitch;
XiaomiManager.prototype.newValueSingleWiredSwitch = newValueSingleWiredSwitch;
XiaomiManager.prototype.newValueSingleWiredSwitchNeutral = newValueSingleWiredSwitchNeutral;
XiaomiManager.prototype.newValueSingleWirelessSwitch = newValueSingleWirelessSwitch;
XiaomiManager.prototype.newValueDuplexWiredSwitch = newValueDuplexWiredSwitch;
XiaomiManager.prototype.newValueDuplexWiredSwitchNeutral = newValueDuplexWiredSwitchNeutral;
XiaomiManager.prototype.newValueDuplexWirelessSwitch = newValueDuplexWirelessSwitch;
XiaomiManager.prototype.newValueLeak = newValueLeak;
XiaomiManager.prototype.newValueVibration = newValueVibration;
XiaomiManager.prototype.listening = listening;
XiaomiManager.prototype.onMessage = onMessage;

// COMMANDS
XiaomiManager.prototype.listen = listen;
XiaomiManager.prototype.getSensors = getSensors;
XiaomiManager.prototype.setValue = setValue;

module.exports = XiaomiManager;
