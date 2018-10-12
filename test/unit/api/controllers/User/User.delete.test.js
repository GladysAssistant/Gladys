var request = require('supertest');

describe('UserController', function() {
  describe('delete', function() {
    it('should delete a user', function(done) {
      request(sails.hooks.http.app)
        .delete('/user/1?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          done();
        });
    });
  });
});
