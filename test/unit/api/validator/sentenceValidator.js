module.exports = validate;

var should = require('should');

function validate(sentence) {
	if(sentence instanceof Array) {
		sentence.forEach(validateSentence);
	} else {
		validateSentence(sentence);
	}
}

function validateSentence(sentence) {
	sentence.should.be.instanceOf(Object);
	sentence.should.have.property('uuid');
	sentence.should.have.property('text');
	sentence.should.have.property('label');
	sentence.should.have.property('service');
	sentence.should.have.property('language');
	sentence.should.have.property('status');
}