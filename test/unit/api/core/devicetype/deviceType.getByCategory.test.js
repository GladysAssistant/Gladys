
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {
  describe('getByCategory', function() {
    it('should get deviceType by category', function(done) {
      gladys.deviceType
        .getByDevice({ category: 'light' })
        .then(function(types) {
          validateDeviceType(types);
          types.forEach(function(type) {
            type.category.should.equal('light');
          });

          done();
        })
        .catch(done);
    });

    it('should get deviceType by category and room', function(done) {
      gladys.deviceType
        .getByDevice({ category: 'light', room: 12 })
        .then(function(types) {
          types.length.should.equal(0);

          done();
        })
        .catch(done);
    });

    it('should get deviceType by category and type', function(done) {
      gladys.deviceType
        .getByDevice({ category: 'light', type: 'UNKNOWN' })
        .then(function(types) {
          types.length.should.equal(0);

          done();
        })
        .catch(done);
    });
  });
});
