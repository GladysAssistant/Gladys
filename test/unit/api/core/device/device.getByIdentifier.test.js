
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {
  describe('getByIdentifier', function() {
    it('should return a device by identifier', function(done) {
      gladys.device
        .getByIdentifier({ service: 'test', identifier: 'THIS_IS_MY_IDENTIFIER' })
        .then(function(device) {
          device.should.be.instanceOf(Object);
          validateDevice(device);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
