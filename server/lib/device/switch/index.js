const { INTENTS } = require('../../../utils/constants');
const { command } = require('./switch.command');

const SwitchManager = function SwitchManager(eventManager, stateManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.stateManager = stateManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.SWITCH.TURN_ON, this.command.bind(this));
  this.eventManager.on(INTENTS.SWITCH.TURN_OFF, this.command.bind(this));
};

SwitchManager.prototype.command = command;

module.exports = SwitchManager;
