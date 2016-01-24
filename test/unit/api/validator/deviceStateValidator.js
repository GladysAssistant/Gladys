module.exports = validate;

var should = require('should');

function validate(deviceState) {
	if(deviceState instanceof Array) {
		deviceState.forEach(validateDeviceState);
	} else {
		validateDeviceState(deviceState);
	}
}

function validateDeviceState(deviceState) {
	deviceState.should.be.instanceOf(Object);
	deviceState.should.have.property('devicetype');
	deviceState.should.have.property('value');
    deviceState.should.have.property('datetime');
}