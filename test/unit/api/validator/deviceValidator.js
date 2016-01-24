module.exports = validate;

var should = require('should');

function validate(device) {
	if(device instanceof Array) {
		device.forEach(validateDevice);
	} else {
		validateDevice(device);
	}
}

function validateDevice(device) {
	device.should.be.instanceOf(Object);
	device.should.have.property('name');
	device.should.have.property('protocol');
	device.should.have.property('room');
}