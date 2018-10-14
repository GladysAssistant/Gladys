var request = require('supertest');
var validateMode = require('../../validator/modeValidator.js');

describe('ModeController', function() {
  describe('create', function() {
    it('should create a mode', function(done) {
      var mode = {
        code: 'test',
        name: 'test',
        description: 'This is a test'
      };

      request(sails.hooks.http.app)
        .post('/mode?token=test')
        .send(mode)
        .expect(201)
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
