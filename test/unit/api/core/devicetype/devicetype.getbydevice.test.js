
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {
  describe('getByDevice', function() {
    it('should get deviceType by device', function(done) {
      gladys.deviceType
        .getByDevice({ id: 1 })
        .then(function(types) {
          validateDeviceType(types);
          types.forEach(function(type) {
            type.device.should.equal(1);
          });

          done();
        })
        .catch(done);
    });
  });
});
