module.exports = validate;

var should = require('should');

function validate(notificationType) {
	if(notificationType instanceof Array) {
		notificationType.forEach(validatenotificationType);
	} else {
		validatenotificationType(notificationType);
	}
}

function validatenotificationType(notificationType) {
	notificationType.should.be.instanceOf(Object);
	notificationType.should.have.property('service');
}