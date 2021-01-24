const EventEmitter = require('events');

const Event = function Event() {
  this.emitter = new EventEmitter();
};

Event.prototype.emit = function emit(event, ...args) {
  this.emitter.emit(event, ...args);
};

Event.prototype.on = function on(event, cb) {
  this.emitter.on(event, cb);
};

Event.prototype.removeListener = function removeListener(event, listener) {
  this.emitter.removeListener(event, listener);
};

module.exports = Event;
