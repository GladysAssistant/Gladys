const { INTENTS } = require('../../../utils/constants');
const { buildLightObject } = require('./light.buildLightObject');
const { command } = require('./light.command');
const { init } = require('./light.init');
const { getLightsInRoom } = require('./light.getLightsInRoom');
const { turnOn } = require('./light.turnOn');
const { turnOff } = require('./light.turnOff');

const LightManager = function Light(eventManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.LIGHT.TURN_ON, this.command.bind(this));
  this.eventManager.on(INTENTS.LIGHT.TURN_OFF, this.command.bind(this));
};

LightManager.prototype.buildLightObject = buildLightObject;
LightManager.prototype.command = command;
LightManager.prototype.init = init;
LightManager.prototype.getLightsInRoom = getLightsInRoom;
LightManager.prototype.turnOn = turnOn;
LightManager.prototype.turnOff = turnOff;

module.exports = LightManager;
