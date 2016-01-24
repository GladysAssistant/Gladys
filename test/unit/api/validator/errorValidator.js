module.exports = validate;

var should = require('should');

function validate(error) {
	if(error instanceof Array) {
		error.forEach(validateError);
	} else {
		validateError(error);
	}
}

function validateError(error) {
	error.should.be.instanceOf(Object);
	error.should.have.property('status');
	error.should.have.property('message');
}