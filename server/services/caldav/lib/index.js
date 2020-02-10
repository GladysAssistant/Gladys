const { formatRecurringEvents, formatEvents, formatCalendars } = require('./calendar/calendar.formaters');
const { syncUserCalendars } = require('./calendar/calendar.syncUserCalendars');
const { cleanUp } = require('./calendar/calendar.cleanUp');
const { config } = require('./config/index');

const CalDAVHandler = function CalDAVHandler(gladys, serviceId, ical, dav, moment, xmlDom, request) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.ical = ical;
  this.dav = dav;
  this.moment = moment;
  this.xmlDom = xmlDom;
  this.request = request;
};

CalDAVHandler.prototype.formatRecurringEvents = formatRecurringEvents;
CalDAVHandler.prototype.formatEvents = formatEvents;
CalDAVHandler.prototype.formatCalendars = formatCalendars;
CalDAVHandler.prototype.syncUserCalendars = syncUserCalendars;
CalDAVHandler.prototype.config = config;
CalDAVHandler.prototype.cleanUp = cleanUp;

module.exports = CalDAVHandler;
