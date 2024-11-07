const { EVENTS } = require('../../utils/constants');
const { create } = require('./message.create');
const { get } = require('./message.get');
const { reply } = require('./message.reply');
const { purge } = require('./message.purge');
const { handleEvent } = require('./message.handleEvent');
const { replyByIntent } = require('./message.replyByIntent');
const { sendToUser } = require('./message.sendToUser');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const MessageHandler = function MessageHandler(event, brain, service, state, variable) {
  this.event = event;
  this.brain = brain;
  this.service = service;
  this.state = state;
  this.variable = variable;
  this.event.on(EVENTS.MESSAGE.NEW, (message) => this.handleEvent(message));
  this.event.on(EVENTS.MESSAGE.PURGE_OLD_MESSAGES, eventFunctionWrapper(this.purge.bind(this)));
};

MessageHandler.prototype.create = create;
MessageHandler.prototype.get = get;
MessageHandler.prototype.handleEvent = handleEvent;
MessageHandler.prototype.reply = reply;
MessageHandler.prototype.purge = purge;
MessageHandler.prototype.replyByIntent = replyByIntent;
MessageHandler.prototype.sendToUser = sendToUser;

module.exports = MessageHandler;
