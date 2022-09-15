const { formatRecurringEvents, formatEvents, formatCalendars } = require('./calendar/calendar.formaters');
const { requestCalendars, requestChanges, requestEventsData } = require('./calendar/calendar.requests');
const { syncUserCalendars } = require('./calendar/calendar.syncUserCalendars');
const { syncUserWebcals } = require('./calendar/calendar.syncUserWebcals');
const { enableCalendar } = require('./calendar/calendar.enableCalendar');
const { disableCalendar } = require('./calendar/calendar.disableCalendar');
const { cleanUp } = require('./calendar/calendar.cleanUp');
const { config } = require('./config/index');

const CalDAVHandler = function CalDAVHandler(gladys, serviceId, ical, dav, dayjs, xmlDom) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.ical = ical;
  this.dav = dav;
  this.dayjs = dayjs;
  this.xmlDom = xmlDom;
};

CalDAVHandler.prototype.formatRecurringEvents = formatRecurringEvents;
CalDAVHandler.prototype.formatEvents = formatEvents;
CalDAVHandler.prototype.formatCalendars = formatCalendars;
CalDAVHandler.prototype.requestCalendars = requestCalendars;
CalDAVHandler.prototype.requestChanges = requestChanges;
CalDAVHandler.prototype.requestEventsData = requestEventsData;
CalDAVHandler.prototype.syncUserCalendars = syncUserCalendars;
CalDAVHandler.prototype.syncUserWebcals = syncUserWebcals;
CalDAVHandler.prototype.enableCalendar = enableCalendar;
CalDAVHandler.prototype.disableCalendar = disableCalendar;
CalDAVHandler.prototype.config = config;
CalDAVHandler.prototype.cleanUp = cleanUp;

module.exports = CalDAVHandler;
