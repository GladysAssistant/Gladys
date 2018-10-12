var request = require('supertest');
var validateDevice = require('../../validator/deviceValidator.js');

describe('DeviceController', function() {
  describe('update', function() {
    it('should update a device', function(done) {
      var device = {
        name: 'New name'
      };

      request(sails.hooks.http.app)
        .patch('/device/1?token=test')
        .send(device)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateDevice(res.body);
          done();
        });
    });
  });
});
