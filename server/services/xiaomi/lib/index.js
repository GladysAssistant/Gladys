// EVENTS
const { newValueCube } = require('./event/xiaomi.newValueCube');
const { newValueMagnetSensor } = require('./event/xiaomi.newValueMagnetSensor');
const { newValueMotionSensor } = require('./event/xiaomi.newValueMotionSensor');
const { newValueTemperatureSensor } = require('./event/xiaomi.newValueTemperatureSensor');
const { newValueSwitch } = require('./event/xiaomi.newValueSwitch');
const { listening } = require('./event/xiaomi.listening');
const { onMessage } = require('./event/xiaomi.onMessage');

// COMMANDS
const { getSensors } = require('./commands/xiaomi.getSensors');
const { listen } = require('./commands/xiaomi.listen');

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
XiaomiManager.prototype.newValueCube = newValueCube;
XiaomiManager.prototype.newValueMagnetSensor = newValueMagnetSensor;
XiaomiManager.prototype.newValueMotionSensor = newValueMotionSensor;
XiaomiManager.prototype.newValueTemperatureSensor = newValueTemperatureSensor;
XiaomiManager.prototype.newValueSwitch = newValueSwitch;
XiaomiManager.prototype.listening = listening;
XiaomiManager.prototype.onMessage = onMessage;

// COMMANDS
XiaomiManager.prototype.listen = listen;
XiaomiManager.prototype.getSensors = getSensors;

module.exports = XiaomiManager;
