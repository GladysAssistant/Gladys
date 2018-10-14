
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {
  describe('get', function() {
    it('should return list of devices', function(done) {
      gladys.device
        .get()
        .then(function(devices) {
          validateDevice(devices);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return list of devices (with passed options)', function(done) {
      var options = {
        take: 20,
        skip: 10
      };

      gladys.device
        .get(options)
        .then(function(devices) {
          validateDevice(devices);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
