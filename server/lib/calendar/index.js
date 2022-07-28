const { create } = require('./calendar.create');
const { destroy } = require('./calendar.destroy');
const { get } = require('./calendar.get');
const { getEvents } = require('./calendar.getEvents');
const { update } = require('./calendar.update');
const { createEvent } = require('./calendar.createEvent');
const { destroyEvent } = require('./calendar.destroyEvent');
const { findCurrentlyRunningEvent } = require('./calendar.findCurrentlyRunningEvent');
const { destroyEvents } = require('./calendar.destroyEvents');
const { updateEvent } = require('./calendar.updateEvent');

const Calendar = function Calendar(service) {
  this.service = service;
};

Calendar.prototype.create = create;
Calendar.prototype.destroy = destroy;
Calendar.prototype.get = get;
Calendar.prototype.getEvents = getEvents;
Calendar.prototype.update = update;
Calendar.prototype.createEvent = createEvent;
Calendar.prototype.destroyEvent = destroyEvent;
Calendar.prototype.findCurrentlyRunningEvent = findCurrentlyRunningEvent;
Calendar.prototype.destroyEvents = destroyEvents;
Calendar.prototype.updateEvent = updateEvent;

module.exports = Calendar;
