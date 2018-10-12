module.exports = validate;



function validate(deviceType) {
  if (deviceType instanceof Array) {
    deviceType.forEach(validateDeviceType);
  } else {
    validateDeviceType(deviceType);
  }
}

function validateDeviceType(deviceType) {
  deviceType.should.be.instanceOf(Object);
  deviceType.should.have.property('type');
  deviceType.should.have.property('sensor');
  deviceType.should.have.property('min');
  deviceType.should.have.property('max');
  deviceType.should.have.property('device');
}
