module.exports = validate;

var should = require('should');

function validate(box) {
	if(box instanceof Array) {
		box.forEach(validateBox);
	} else {
		validateBox(box);
	}
}

function validateBox(box) {
	box.should.be.instanceOf(Object);
    box.should.have.property('title');
    box.should.have.property('x');
    box.should.have.property('y');
    box.should.have.property('user');
}