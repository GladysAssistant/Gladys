var request = require('supertest');
var validateLocation = require('../../validator/locationValidator.js');

describe('LocationController', function() {
  describe('create', function() {
    it('should create a location', function(done) {
      var location = {
        latitude: 4.2,
        longitude: 3.1
      };

      request(sails.hooks.http.app)
        .post('/location?token=test')
        .send(location)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateLocation(res.body);
          done();
        });
    });
  });
});
