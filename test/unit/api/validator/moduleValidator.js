module.exports = validate;

var should = require('should');

function validate(module) {
	if(module instanceof Array) {
		module.forEach(validateModule);
	} else {
		validateModule(module);
	}
}

function validateModule(module) {
	module.should.be.instanceOf(Object);
	module.should.have.property('slug');
	module.should.have.property('url');
    module.should.have.property('status');
}