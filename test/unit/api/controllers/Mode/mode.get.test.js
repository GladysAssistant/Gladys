var request = require('supertest');
var validateMode = require('../../validator/modeValidator.js');

describe('ModeController', function() {
  describe('get', function() {
    it('should get all mode', function(done) {
      request(sails.hooks.http.app)
        .get('/mode?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateMode(res.body);
          done();
        });
    });
  });
});
