const EventLog = function EventLog() {};

const {add} = require('./event.log.add');
const {get} = require('./event.log.get');

EventLog.prototype.add = add;
EventLog.prototype.get = get;

module.exports = {EventLog};