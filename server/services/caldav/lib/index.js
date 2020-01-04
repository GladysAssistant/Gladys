const { formatRecurringEvents, formatEvents, formatCalendars } = require('./calendar/calendar.formaters');
const { updateCalendarEvents } = require('./calendar/calendar.updateCalendarEvents');
const { updateCalendars } = require('./calendar/calendar.updateCalendars');
const { syncUserCalendars } = require('./calendar/calendar.syncUserCalendars');
const { connect } = require('./calendar/connect');
const { config } = require('./config/index');
const { iCloud } = require('./config/iCloud');

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
CalDAVHandler.prototype.updateCalendarEvents = updateCalendarEvents;
CalDAVHandler.prototype.updateCalendars = updateCalendars;
CalDAVHandler.prototype.syncUserCalendars = syncUserCalendars;
CalDAVHandler.prototype.connect = connect;
CalDAVHandler.prototype.config = config;
CalDAVHandler.prototype.iCloud = iCloud;

module.exports = CalDAVHandler;
