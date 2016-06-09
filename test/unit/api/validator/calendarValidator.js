module.exports = validate;

var should = require('should');

function validate(calendar) {
	if(calendar instanceof Array) {
		calendar.forEach(validateCalendar);
	} else {
		validateCalendar(calendar);
	}
}

function validateCalendar(calendar) {
	calendar.should.be.instanceOf(Object);
    calendar.should.have.property('user');
    calendar.should.have.property('active');
    calendar.should.have.property('externalid');
}