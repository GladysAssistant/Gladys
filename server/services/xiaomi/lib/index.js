const dgram = require('dgram');
// EVENTS
const { addTemperatureSensor } = require('./event/xiaomi.addTemperatureSensor');
const { updateTemperatureSensor } = require('./event/xiaomi.updateTemperatureSensor');
const { addThSensor } = require('./event/xiaomi.addThSensor');
const { addMagnetSensor } = require('./event/xiaomi.addMagnetSensor');
const { addMotionSensor } = require('./event/xiaomi.addMotionSensor');
const { getError } = require('./event/xiaomi.getError');
const { listening } = require('./event/xiaomi.listening');
const { onMessage } = require('./event/xiaomi.onMessage');
const { updateBooleanSensor } = require('./event/xiaomi.updateBooleanSensor');
const { addPlugSensor } = require('./event/xiaomi.addPlugSensor');

// COMMANDS
const { getSensor } = require('./commands/xiaomi.getSensor');

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
  this.sensor = {};

  this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  this.socket.on('listening', this.listening.bind(this));
  this.socket.on('message', this.onMessage.bind(this));
  this.socket.on('data.weather', this.addTemperatureSensor.bind(this));
  this.socket.bind(9898);
};

// EVENTS
XiaomiManager.prototype.addTemperatureSensor = addTemperatureSensor;
XiaomiManager.prototype.addThSensor = addThSensor;
XiaomiManager.prototype.addMagnetSensor = addMagnetSensor;
XiaomiManager.prototype.addMotionSensor = addMotionSensor;
XiaomiManager.prototype.getError = getError;
XiaomiManager.prototype.listening = listening;
XiaomiManager.prototype.onMessage = onMessage;
XiaomiManager.prototype.updateTemperatureSensor = updateTemperatureSensor;
XiaomiManager.prototype.updateBooleanSensor = updateBooleanSensor;
XiaomiManager.prototype.addPlugSensor = addPlugSensor;

// COMMANDS
XiaomiManager.prototype.getSensor = getSensor;
module.exports = XiaomiManager;
