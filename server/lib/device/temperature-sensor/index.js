const { command } = require('./temperature-sensor.command');
const { getTemperatureInRoom } = require('./temperature-sensor.getTemperatureInRoom');
const { INTENTS } = require('../../../utils/constants');

const TemperatureSensorManager = function TemperatureSensorManager(eventManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.TEMPERATURE_SENSOR.GET_IN_ROOM, this.command.bind(this));
};

TemperatureSensorManager.prototype.command = command;
TemperatureSensorManager.prototype.getTemperatureInRoom = getTemperatureInRoom;

module.exports = TemperatureSensorManager;
