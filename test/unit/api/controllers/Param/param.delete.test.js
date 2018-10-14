var request = require('supertest');

describe('Param', function() {
  describe('delete', function() {
    it('should delete a param', function(done) {
      request(sails.hooks.http.app)
        .delete('/param/quote_of_the_day?token=test')
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
