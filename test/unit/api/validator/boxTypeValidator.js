module.exports = validate;

var should = require('should');

function validate(boxTypes) {
	if(boxTypes instanceof Array) {
		boxTypes.forEach(validateBoxType);
	} else {
		validateBoxType(boxTypes);
	}
}

function validateBoxType(boxType) {
	boxType.should.be.instanceOf(Object);
    boxType.should.have.property('title');
    boxType.should.have.property('icon');
    boxType.should.have.property('type');
    boxType.should.have.property('view');
}