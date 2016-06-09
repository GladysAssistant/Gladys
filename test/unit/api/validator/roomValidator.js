module.exports = validate;

var should = require('should');

function validate(room) {
	if(room instanceof Array) {
		room.forEach(validateRoom);
	} else {
		validateRoom(room);
	}
}

function validateRoom(room) {
	room.should.be.instanceOf(Object);
	room.should.have.property('name');
	room.should.have.property('house');
}