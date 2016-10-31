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
	devicetype.should.be.instanceOf(Object);
	devicetype.should.have.property('id');
	devicetype.should.have.property('type');
	devicetype.should.have.property('unit');
        devicetype.should.have.property('sensor');
        devicetype.should.have.property('device');
        devicetype.should.have.property('min');
        devicetype.should.have.property('max');
        devicetype.should.have.property('identifier');
        devicetype.should.have.property('service');
        devicetype.should.have.property('lastValue');
}
