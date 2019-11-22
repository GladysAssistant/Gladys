const { formatRecurringEvents, formatEvents, formatCalendars } = require('./calendar/calendar.formaters');
const { sync } = require('./calendar/calendar.sync');
const { syncCalendarEvents } = require('./calendar/calendar.syncCalendarEvents');
const { syncCalendars } = require('./calendar/calendar.syncCalendars');
const { syncUser } = require('./calendar/calendar.syncUser');
const { syncAllUsers } = require('./calendar/calendar.syncAllUsers');
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
CalDAVHandler.prototype.sync = sync;
CalDAVHandler.prototype.syncCalendarEvents = syncCalendarEvents;
CalDAVHandler.prototype.syncCalendars = syncCalendars;
CalDAVHandler.prototype.syncUser = syncUser;
CalDAVHandler.prototype.syncAllUsers = syncAllUsers;
CalDAVHandler.prototype.connect = connect;
CalDAVHandler.prototype.config = config;
CalDAVHandler.prototype.iCloud = iCloud;

module.exports = CalDAVHandler;
