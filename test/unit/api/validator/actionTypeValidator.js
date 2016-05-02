module.exports = validate;

var should = require('should');

function validate(actionType) {
	if(actionType instanceof Array) {
		actionType.forEach(validateActionType);
	} else {
		validateActionType(actionType);
	}
}

function validateActionType(actionType) {
	actionType.should.be.instanceOf(Object);
    
    actionType.should.have.property('service');
    actionType.should.have.property('function');
    actionType.should.have.property('name');
}