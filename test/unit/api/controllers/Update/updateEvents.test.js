var request = require('supertest');

describe('UpdateController', function() {
  describe('updateEvents', function() {
    it.skip('should update Events', function(done) {
      request(sails.hooks.http.app)
        .get('/update/event?token=test')
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
