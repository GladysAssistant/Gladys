const { sync } = require('./calendar/calendar.sync');

const CalDAVHandler = function CalDAVHandler(gladys, serviceId, ical, dav, moment) {
    this.gladys = gladys;
    this.serviceId = serviceId;
    this.ical = ical;
    this.dav = dav;
    this.moment = moment;
};

CalDAVHandler.prototype.sync = sync;

module.exports = CalDAVHandler;