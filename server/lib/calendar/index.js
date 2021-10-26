const schedule = require('node-schedule');

const { create } = require('./calendar.create');
const { destroy } = require('./calendar.destroy');
const { get } = require('./calendar.get');
const { getEvents } = require('./calendar.getEvents');
const { update } = require('./calendar.update');
const { createEvent } = require('./calendar.createEvent');
const { destroyEvent } = require('./calendar.destroyEvent');
const { destroyEvents } = require('./calendar.destroyEvents');
const { updateEvent } = require('./calendar.updateEvent');
const { createScheduledEvent } = require('./calendar.createScheduledEvent');
const { getScheduledEvents } = require('./calendar.getScheduledEvents');

const Calendar = function Calendar(service, eventManager) {
  this.service = service;
  this.eventManager = eventManager;
  this.schedule = schedule;
};

Calendar.prototype.create = create;
Calendar.prototype.destroy = destroy;
Calendar.prototype.get = get;
Calendar.prototype.getEvents = getEvents;
Calendar.prototype.update = update;
Calendar.prototype.createEvent = createEvent;
Calendar.prototype.destroyEvent = destroyEvent;
Calendar.prototype.destroyEvents = destroyEvents;
Calendar.prototype.updateEvent = updateEvent;
Calendar.prototype.createScheduledEvent = createScheduledEvent;
Calendar.prototype.getScheduledEvents = getScheduledEvents;

module.exports = Calendar;
