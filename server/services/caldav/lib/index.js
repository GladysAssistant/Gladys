const { formatRecurringEvents, formatEvents, formatCalendars } = require('./calendar/calendar.formaters');
const { requestCalendars, requestChanges, requestEventsData } = require('./calendar/calendar.requests');
const { syncUserCalendars } = require('./calendar/calendar.syncUserCalendars');
const { cleanUp } = require('./calendar/calendar.cleanUp');
const { config } = require('./config/index');

const CalDAVHandler = function CalDAVHandler(gladys, serviceId, ical, dav, moment, xmlDom) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.ical = ical;
  this.dav = dav;
  this.moment = moment;
  this.xmlDom = xmlDom;
};

CalDAVHandler.prototype.formatRecurringEvents = formatRecurringEvents;
CalDAVHandler.prototype.formatEvents = formatEvents;
CalDAVHandler.prototype.formatCalendars = formatCalendars;
CalDAVHandler.prototype.requestCalendars = requestCalendars;
CalDAVHandler.prototype.requestChanges = requestChanges;
CalDAVHandler.prototype.requestEventsData = requestEventsData;
CalDAVHandler.prototype.syncUserCalendars = syncUserCalendars;
CalDAVHandler.prototype.config = config;
CalDAVHandler.prototype.cleanUp = cleanUp;

module.exports = CalDAVHandler;
