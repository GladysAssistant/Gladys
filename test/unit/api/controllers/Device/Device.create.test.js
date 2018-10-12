var request = require('supertest');
var validateDevice = require('../../validator/deviceValidator.js');

describe('DeviceController', function() {
  describe('create', function() {
    it('should create a device', function(done) {
      var obj = {
        device: {
          name: 'Light in my room',
          protocol: 'milight',
          service: 'MilightService',
          room: 1
        },

        types: [
          {
            type: 'binary',
            sensor: false,
            min: 0,
            max: 1
          }
        ]
      };

      request(sails.hooks.http.app)
        .post('/device?token=test')
        .send(obj)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateDevice(res.body.device);
          res.body.types.should.be.instanceOf(Array);
          done();
        });
    });
  });
});
