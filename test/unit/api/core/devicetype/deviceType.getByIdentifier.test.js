
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {
  describe('getByIdentifier', function() {
    it('should get deviceType by Identifier', function(done) {
      gladys.deviceType
        .getByIdentifier({
          deviceIdentifier: 'THIS_IS_MY_IDENTIFIER',
          deviceService: 'test',
          deviceTypeIdentifier: 'UNIQUE_IDENTIFIER'
        })
        .then(function(type) {
          type.should.be.instanceOf(Object);
          validateDeviceType(type);
          type.id.should.equal(1);
          done();
        })
        .catch(done);
    });
  });
});
