module.exports = validate;

var should = require('should');

function validate(param) {
	if(param instanceof Array) {
		param.forEach(validateparam);
	} else {
		validateparam(param);
	}
}

function validateparam(param) {
	param.should.be.instanceOf(Object);
	param.should.have.property('name');
    param.should.have.property('value');
}