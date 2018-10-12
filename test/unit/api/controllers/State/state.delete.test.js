var request = require('supertest');

describe('State', function() {
  describe('delete', function() {
    it('should delete a state', function(done) {
      request(sails.hooks.http.app)
        .delete('/state/1?token=test')
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
