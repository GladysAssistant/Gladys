module.exports = validate;

var should = require('should');

function validate(stateType) {
	if(stateType instanceof Array) {
		stateType.forEach(validateStateType);
	} else {
		validateStateType(stateType);
	}
}

function validateStateType(stateType) {
	stateType.should.be.instanceOf(Object);
    stateType.should.have.property('name');
    stateType.should.have.property('description');
    stateType.should.have.property('uuid');
    stateType.should.have.property('service');
    stateType.should.have.property('function');
}