
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {
  describe('getByTag', function() {
    it('should return devicetypes by tag', function(done) {
      gladys.deviceType
        .getByTag({
          tag: 'light'
        })
        .then(function(types) {
          types.should.be.instanceOf(Array);
          validateDeviceType(types);
          types.forEach((type) => {
            type.tag.should.equal('light');
          });
          done();
        })
        .catch(done);
    });

    it('should return devicetypes by tags (array)', function(done) {
      gladys.deviceType
        .getByTag({
          tag: ['light']
        })
        .then(function(types) {
          types.should.be.instanceOf(Array);
          validateDeviceType(types);
          types.forEach((type) => {
            type.tag.should.equal('light');
          });
          done();
        })
        .catch(done);
    });
  });
});
