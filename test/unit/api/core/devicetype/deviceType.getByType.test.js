
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {
  describe('getByType', function() {
    it('should return a list of deviceType by type', function(done) {
      var device = {
        type: 'binary'
      };

      gladys.deviceType
        .getByType(device)
        .then(function(types) {
          validateDeviceType(types);
          types.forEach(function(type) {
            type.type.should.equal(device.type);
          });
          done();
        })
        .catch(done);
    });
  });
});
