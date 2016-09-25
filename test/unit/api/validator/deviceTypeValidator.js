module.exports = validate;

var should = require('should');

function validate(devicetype) {
	if(devicetype instanceof Array) {
		devicetype.forEach(validateDeviceType);
	} else {
		validateDeviceType(devicetype);
	}
}

function validateDeviceType(devicetype) {
	device.should.be.instanceOf(Object);
	device.should.have.property('id');
	device.should.have.property('type');
	device.should.have.property('tag');
        device.should.have.property('sensor');
        device.should.have.property('device');
        device.should.have.property('min');
        device.should.have.property('max');
}
