const { formatRecurringEvents, formatEvents, formatCalendars } = require('./calendar/calendar.formaters');
const { sync } = require('./calendar/calendar.sync');
const { syncCalendarEvents } = require('./calendar/calendar.syncCalendarEvents');
const { syncCalendars } = require('./calendar/calendar.syncCalendars');
const { syncUser } = require('./calendar/calendar.syncUser');
const { connect } = require('./calendar/connect');

const CalDAVHandler = function CalDAVHandler(gladys, serviceId, ical, dav, moment) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.ical = ical;
  this.dav = dav;
  this.moment = moment;
};

CalDAVHandler.prototype.formatRecurringEvents = formatRecurringEvents;
CalDAVHandler.prototype.formatEvents = formatEvents;
CalDAVHandler.prototype.formatCalendars = formatCalendars;
CalDAVHandler.prototype.sync = sync;
CalDAVHandler.prototype.syncCalendarEvents = syncCalendarEvents;
CalDAVHandler.prototype.syncCalendars = syncCalendars;
CalDAVHandler.prototype.syncUser = syncUser;
CalDAVHandler.prototype.connect = connect;

module.exports = CalDAVHandler;
