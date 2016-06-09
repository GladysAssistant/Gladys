module.exports = validate;

var should = require('should');

function validate(location) {
	if(location instanceof Array) {
		location.forEach(validatelocation);
	} else {
		validatelocation(location);
	}
}

function validatelocation(location) {
	location.should.be.instanceOf(Object);
	location.should.have.property('datetime');
	location.should.have.property('user');
	location.should.have.property('latitude');
    location.should.have.property('longitude');
}