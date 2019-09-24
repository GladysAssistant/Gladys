// EVENTS
const { addDevice } = require('./event/xiaomi.addDevice');
const { newValueCube } = require('./event/xiaomi.newValueCube');
const { newValueGateway } = require('./event/xiaomi.newValueGateway');
const { newValueMagnetSensor } = require('./event/xiaomi.newValueMagnetSensor');
const { newValueMotionSensor } = require('./event/xiaomi.newValueMotionSensor');
const { newValueTemperatureSensor } = require('./event/xiaomi.newValueTemperatureSensor');
const { newValueSwitch } = require('./event/xiaomi.newValueSwitch');
const { newValueLeak } = require('./event/xiaomi.newValueLeak');
const { listening } = require('./event/xiaomi.listening');
const { onMessage } = require('./event/xiaomi.onMessage');

// COMMANDS
const { getSensors } = require('./commands/xiaomi.getSensors');
const { listen } = require('./commands/xiaomi.listen');
const { setValue } = require('./commands/xiaomi.setValue');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * hubDiscover(gladys, serviceId)
 */
const XiaomiManager = function hubDiscover(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.sensors = {};
};

// EVENTS
XiaomiManager.prototype.addDevice = addDevice;
XiaomiManager.prototype.newValueCube = newValueCube;
XiaomiManager.prototype.newValueGateway = newValueGateway;
XiaomiManager.prototype.newValueMagnetSensor = newValueMagnetSensor;
XiaomiManager.prototype.newValueMotionSensor = newValueMotionSensor;
XiaomiManager.prototype.newValueTemperatureSensor = newValueTemperatureSensor;
XiaomiManager.prototype.newValueSwitch = newValueSwitch;
XiaomiManager.prototype.newValueLeak = newValueLeak;
XiaomiManager.prototype.listening = listening;
XiaomiManager.prototype.onMessage = onMessage;

// COMMANDS
XiaomiManager.prototype.listen = listen;
XiaomiManager.prototype.getSensors = getSensors;
XiaomiManager.prototype.setValue = setValue;

module.exports = XiaomiManager;
