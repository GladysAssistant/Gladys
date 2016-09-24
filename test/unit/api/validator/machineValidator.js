module.exports = validate;

var should = require('should');

function validate(machine) {
	if(machine instanceof Array) {
		machine.forEach(validateMachine);
	} else {
		validateMachine(machine);
	}
}

function validateMachine(machine) {
	machine.should.be.instanceOf(Object);
	machine.should.have.property('uuid');
	machine.should.have.property('host');
}