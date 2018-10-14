var request = require('supertest');
var validateUser = require('../../validator/userValidator.js');

describe('UserController', function() {
  describe('get', function() {
    it('should get users', function(done) {
      request(sails.hooks.http.app)
        .get('/user?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateUser(res.body);
          done();
        });
    });
  });
});
