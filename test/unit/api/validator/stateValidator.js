module.exports = validate;

var should = require('should');

function validate(state) {
	if(state instanceof Array) {
		state.forEach(validateState);
	} else {
		validateState(state);
	}
}

function validateState(state) {
	state.should.be.instanceOf(Object);
    state.should.have.property('launcher');
    state.should.have.property('condition_template');
    state.should.have.property('active');
}