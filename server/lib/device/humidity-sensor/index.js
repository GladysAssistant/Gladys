const { command } = require('./humidity-sensor.command');
const { getHumidityInRoom } = require('./humidity-sensor.getHumidityInRoom');
const { INTENTS } = require('../../../utils/constants');

const HumiditySensorManager = function HumiditySensorManager(eventManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.HUMIDITY_SENSOR.GET_IN_ROOM, this.command.bind(this));
};

HumiditySensorManager.prototype.command = command;
HumiditySensorManager.prototype.getHumidityInRoom = getHumidityInRoom;

module.exports = HumiditySensorManager;
