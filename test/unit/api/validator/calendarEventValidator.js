module.exports = validate;

var should = require('should');

function validate(calendarEvent) {
	if(calendarEvent instanceof Array) {
		calendarEvent.forEach(validateCalendarEvent);
	} else {
		validateCalendarEvent(calendarEvent);
	}
}

function validateCalendarEvent(calendarEvent) {
	calendarEvent.should.be.instanceOf(Object);
    calendarEvent.should.have.property('calendar');
    calendarEvent.should.have.property('externalid');
}