module.exports = validate;

var should = require('should');

function validate(notificationUser) {
	if(notificationUser instanceof Array) {
		notificationUser.forEach(validateNotificationUser);
	} else {
		validateNotificationUser(notificationUser);
	}
}

function validateNotificationUser(notificationUser) {
	notificationUser.should.be.instanceOf(Object);
	notificationUser.should.have.property('user');
	notificationUser.should.have.property('notificationtype');
}