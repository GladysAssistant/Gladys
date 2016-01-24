module.exports = validate;

var should = require('should');

function validate(lifeEvent) {
	if(lifeEvent instanceof Array) {
		lifeEvent.forEach(validatelifeEvent);
	} else {
		validatelifeEvent(lifeEvent);
	}
}

function validatelifeEvent(lifeEvent) {
	lifeEvent.should.be.instanceOf(Object);
	lifeEvent.should.have.property('datetime');
	lifeEvent.should.have.property('user');
	lifeEvent.should.have.property('eventtype');
}