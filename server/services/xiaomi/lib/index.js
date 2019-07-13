// EVENTS
const { addTemperatureSensor } = require('./event/xiaomi.addTemperatureSensor');
const { addThSensor } = require('./event/xiaomi.addThSensor');
const { addMagnetSensor } = require('./event/xiaomi.addMagnetSensor');
const { addMotionSensor } = require('./event/xiaomi.addMotionSensor');
const { getError } = require('./event/xiaomi.getError');

// COMMANDS
const { getTemperatureSensor } = require('./commands/xiaomi.getTemperatureSensor');
const { getThSensor } = require('./commands/xiaomi.getThSensor');
const { getMagnetSensor } = require('./commands/xiaomi.getMagnetSensor');
const { getMotionSensor } = require('./commands/xiaomi.getMotionSensor');

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
  this.temperatureSensor = {};
  this.magnetSensor = {};
  this.motionSensor = {};
  this.sensor = {};

  const { Hub } = require('node-xiaomi-smart-home');
  const xiaomi = new Hub();
  xiaomi.listen();
  xiaomi.on('error', this.getError.bind(this));
  xiaomi.on('data.weather', this.addTemperatureSensor.bind(this));
  xiaomi.on('data.magnet', this.addMagnetSensor.bind(this));
  xiaomi.on('data.motion', this.addMotionSensor.bind(this));
  xiaomi.on('data.th', this.addThSensor.bind(this));
};

// EVENTS
XiaomiManager.prototype.addTemperatureSensor = addTemperatureSensor;
XiaomiManager.prototype.addThSensor = addThSensor;
XiaomiManager.prototype.addMagnetSensor = addMagnetSensor;
XiaomiManager.prototype.addMotionSensor = addMotionSensor;
XiaomiManager.prototype.getError = getError;

// COMMANDS
XiaomiManager.prototype.getTemperatureSensor = getTemperatureSensor;
XiaomiManager.prototype.getThSensor = getThSensor;
XiaomiManager.prototype.getMagnetSensor = getMagnetSensor;
XiaomiManager.prototype.getMotionSensor = getMotionSensor;

module.exports = XiaomiManager;
