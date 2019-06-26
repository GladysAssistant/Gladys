const { EVENTS } = require('../../utils/constants');
const { create } = require('./message.create');
const { get } = require('./message.get');
const { reply } = require('./message.reply');
const { handleEvent } = require('./message.handleEvent');
const { replyByIntent } = require('./message.replyByIntent');

const MessageHandler = function MessageHandler(event, brain, service) {
  this.event = event;
  this.brain = brain;
  this.service = service;
  event.on(EVENTS.MESSAGE.NEW, (message) => this.handleEvent(message));
};

MessageHandler.prototype.create = create;
MessageHandler.prototype.get = get;
MessageHandler.prototype.handleEvent = handleEvent;
MessageHandler.prototype.reply = reply;
MessageHandler.prototype.replyByIntent = replyByIntent;

module.exports = MessageHandler;
