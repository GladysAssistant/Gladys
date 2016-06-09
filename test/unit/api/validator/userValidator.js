module.exports = validate;

var should = require('should');

function validate(user) {
	if(user instanceof Array) {
		user.forEach(validateUser);
	} else {
		validateUser(user);
	}
}

function validateUser(user) {
	user.should.be.instanceOf(Object);
    user.should.have.property('firstname');
    user.should.have.property('lastname');
    user.should.have.property('email');
    user.should.have.property('language');
    user.should.have.property('birthdate');
    user.should.have.property('gender');
}