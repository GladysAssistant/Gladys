const Promise = require('bluebird');
const EventEmitter = require('events');

const resolvedPromise = Promise.resolve();

const Event = function Event() {
  this.emitter = new EventEmitter();
};

Event.prototype.emit = async function emit(event, ...args) {
  // This Promise.resolve() is useless,
  // but it makes this function async,
  // meaning that the .emit is no longer synchronous, and
  // let Gladys breathe between each event
  // otherwise, some integrations becomes too blocking
  // and blocks the event loop
  await resolvedPromise;
  this.emitter.emit(event, ...args);
};

Event.prototype.on = function on(event, cb) {
  this.emitter.on(event, cb);
};

Event.prototype.removeListener = function removeListener(event, cb) {
  this.emitter.removeListener(event, cb);
};

Event.prototype.listenerCount = function listenerCount(event) {
  return this.emitter.listenerCount(event);
};

module.exports = Event;
