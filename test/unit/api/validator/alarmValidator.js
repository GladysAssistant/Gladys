module.exports = validate;

var should = require('should');

function validate(alarm) {
	if(alarm instanceof Array) {
		alarm.forEach(validateAlarm);
	} else {
		validateAlarm(alarm);
	}
}

function validateAlarm(alarm) {
	alarm.should.be.instanceOf(Object);
    alarm.should.have.property('user');
    alarm.should.have.property('active');
}