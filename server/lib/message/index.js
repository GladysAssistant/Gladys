const { EVENTS } = require('../../utils/constants');
const { create } = require('./message.create');
const { get } = require('./message.get');
const { reply } = require('./message.reply');
const { handleEvent } = require('./message.handleEvent');
const { replyByIntent } = require('./message.replyByIntent');
const { sendToUser } = require('./message.sendToUser');

const MessageHandler = function MessageHandler(event, brain, service, state, variable) {
  this.event = event;
  this.brain = brain;
  this.service = service;
  this.state = state;
  this.variable = variable;
  event.on(EVENTS.MESSAGE.NEW, (message) => this.handleEvent(message));
};

MessageHandler.prototype.create = create;
MessageHandler.prototype.get = get;
MessageHandler.prototype.handleEvent = handleEvent;
MessageHandler.prototype.reply = reply;
MessageHandler.prototype.replyByIntent = replyByIntent;
MessageHandler.prototype.sendToUser = sendToUser;

module.exports = MessageHandler;
