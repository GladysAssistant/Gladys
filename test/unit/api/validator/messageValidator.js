module.exports = validate;

var should = require('should');

function validate(message) {
	if(message instanceof Array) {
		message.forEach(validateMessage);
	} else {
		validateMessage(message);
	}
}

function validateMessage(message) {
	message.should.be.instanceOf(Object);
	message.should.have.property('text');
    message.should.have.property('sender');
    message.should.have.property('receiver');
}